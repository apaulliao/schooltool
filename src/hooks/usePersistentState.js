import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 強化版持久化 Hook
 * @param {string} key - LocalStorage 鍵名
 * @param {any} defaultValue - 預設值
 * @param {string} version - 資料版本號，若版本不同會強制重置 (選填)
 */
function usePersistentState(key, defaultValue, version = '1.0') {
  // 使用 useRef 避免在 useEffect 中直接依賴 defaultValue 導致無限循環
  const defaultValueRef = useRef(defaultValue);

  // 1. 初始化 State
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = JSON.parse(saved);

        // 版本校驗：如果儲存的資料版本與目前要求的版本不符，則回退到預設值
        // 這樣可以防止未來你修改了資料結構，導致舊資料讓程式崩潰
        if (parsed?._v === version) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn(`讀取 localStorage "${key}" 失敗:`, error);
    }
    
    // 取得初始值（支援 function 形式）
    const initialValue = typeof defaultValueRef.current === 'function' 
      ? defaultValueRef.current() 
      : defaultValueRef.current;
    return initialValue;
  });

  // 2. 寫入 localStorage (附帶版本資訊)
  useEffect(() => {
    try {
      const payload = {
        data: state,
        _v: version,
        _ts: Date.now() // 加入時間戳記有助於未來偵錯
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      console.warn(`儲存 localStorage "${key}" 失敗:`, error);
    }
  }, [key, state, version]);

  // 3. 跨分頁同步 (Storage Event)
  // 當老師在標籤頁 A 修改了設定，標籤頁 B 會即時更新 UI
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?._v === version) {
            setState(parsed.data);
          }
        } catch (err) {
          // 解析失敗不更新 state
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, version]);

  return [state, setState];
}

export default usePersistentState;