import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import usePersistentState from '../hooks/usePersistentState';
// 引入系統預設字典 (請確認路徑是否正確)
import { POLYPHONE_MAP } from '../constants/polyphoneDict'; 

// 1. 建立 Context
const OSContext = createContext();

// 2. 建立 Provider (大腦本體)
export const OSProvider = ({ children }) => {
  // --- 核心狀態：目前開啟的 App ---
  const [currentAppId, setCurrentAppId] = useState('dashboard');
  
  // --- 核心狀態：Launcher 位置 ---
  const [launcherPosition, setLauncherPosition] = usePersistentState('os_launcher_pos', 'left');

  // --- 系統偏好：注音模式 ---
  const [isGlobalZhuyin, setIsGlobalZhuyin] = usePersistentState('classroom_os_zhuyin_mode', false);

  // --- 擴充功能：使用者自訂破音字字典 ---
  // key: 詞語 (如 "銀行"), value: 帶 IVS 的字串
  const [userDict, setUserDict] = usePersistentState('user_custom_polyphones', {}, '1.0');

  // --- 硬體偵測：字型安裝狀態 ---
  const [fontInstalled, setFontInstalled] = useState(false);

  // 字型偵測邏輯
  useEffect(() => {
    const checkLocalFont = () => {
      const text = "測試注音寬度 Test";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "72px sans-serif";
      const baselineWidth = context.measureText(text).width;
      const targetFontNames = ["ㄅ源泉注音圓體","ㄅ源泉注音圓體L", "源泉注音圓體L","源泉注音圓體","BpmfGenSenRounded", "BpmfGenSenRounded-L"];
      
      let isInstalled = false;
      for (const fontName of targetFontNames) {
        context.font = `72px "${fontName}", sans-serif`;
        if (context.measureText(text).width !== baselineWidth) {
          isInstalled = true;
          break;
        }
      }
      if (isInstalled) setFontInstalled(true);
    };
    
    setTimeout(checkLocalFont, 500);
  }, []);

  // --- 核心邏輯：注音校正引擎 (混合 System + User) ---
  
  // 優化效能：當 userDict 改變時，才重新計算合併後的 Key 排序
  // 這裡非常重要：必須將 User 與 System 合併後，統一依「長度」排序，
  // 才能確保「長詞優先匹配」(例如：先換「銀行」，才換「行」)
  const sortedReplacementKeys = useMemo(() => {
    // 1. 合併字典 (User 覆蓋 System)
    const combinedMap = { ...POLYPHONE_MAP, ...userDict };
    // 2. 取出所有 Key 並依長度遞減排序
    return Object.keys(combinedMap).sort((a, b) => b.length - a.length);
  }, [userDict]);

  const fixZhuyinText = useCallback((text) => {
    if (!text || typeof text !== 'string') return text;
    
    let processed = text;
    // 為了效能，我們需要在此處讀取合併後的字典值
    const combinedMap = { ...POLYPHONE_MAP, ...userDict };

    sortedReplacementKeys.forEach(word => {
      // 只有當字串內還包含該詞彙時才替換 (避免重複處理已加上 IVS 的字)
      if (processed.includes(word)) {
        const replacement = combinedMap[word];
        processed = processed.split(word).join(replacement);
      }
    });
    
    return processed;
  }, [sortedReplacementKeys, userDict]);

  // --- 操作介面：新增/刪除自訂讀音 ---
  const addCustomReading = (phrase, ivsString) => {
    setUserDict(prev => ({
      ...prev,
      [phrase]: ivsString
    }));
  };

  const removeCustomReading = (phrase) => {
    setUserDict(prev => {
      const next = { ...prev };
      delete next[phrase];
      return next;
    });
  };

  // 3. 打包所有功能
  const value = {
    currentAppId,
    setCurrentAppId,
    launcherPosition,
    setLauncherPosition,
    isGlobalZhuyin,
    setIsGlobalZhuyin,
    fontInstalled,
    // 新增的注音相關功能
    userDict,
    fixZhuyinText,
    addCustomReading,
    removeCustomReading
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

// 4. 自訂 Hook
export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};