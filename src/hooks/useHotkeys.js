import { useEffect } from 'react';

export const useHotkeys = (keyMap = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. 忽略輸入框內的按鍵 (避免打字時觸發功能)
      // 但允許 Esc, Ctrl+Z 等功能鍵即使在輸入框也能運作，視需求而定
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      
      // 2. 判斷按鍵組合
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey; // Windows Ctrl 或 Mac Command
      const shift = event.shiftKey;
      const alt = event.altKey;

      // 3. 建立指紋 (Fingerprint) 來比對 KeyMap
      // 格式範例: "ctrl+z", "alt+1", "escape", "f"
      const modifiers = [];
      if (ctrl) modifiers.push('ctrl');
      if (alt) modifiers.push('alt');
      if (shift) modifiers.push('shift');
      
      // 組合最終字串
      let keyFingerprint;
      if (modifiers.length > 0) {
          keyFingerprint = `${modifiers.join('+')}+${key}`;
      } else {
          keyFingerprint = key;
      }

      // 4. 特殊處理: 如果是單一字母快捷鍵 (如 'f'), 且正在輸入文字，則忽略
      if (isInputActive && modifiers.length === 0 && key !== 'escape') {
          return;
      }

      // 5. 執行對應函式
      if (keyMap[keyFingerprint]) {
        event.preventDefault(); // 阻止預設行為 (例如 Ctrl+S 存檔)
        keyMap[keyFingerprint](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap]);
};