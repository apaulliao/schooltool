import React, { createContext, useContext, useState, useEffect } from 'react';
import usePersistentState from '../hooks/usePersistentState';

// 1. 建立 Context
const OSContext = createContext();

// 2. 建立 Provider (大腦本體)
export const OSProvider = ({ children }) => {
  // --- 核心狀態：目前開啟的 App ---
  // (將 App 切換權限收歸 OS 所有，這樣以後甚至可以在「聯絡簿」裡直接跳轉「監考」)
  const [currentAppId, setCurrentAppId] = useState('dashboard');
  
  // --- 核心狀態：Launcher 位置 ---
  const [launcherPosition, setLauncherPosition] = usePersistentState('os_launcher_pos', 'left');

  // --- 系統偏好：注音模式 ---
  const [isGlobalZhuyin, setIsGlobalZhuyin] = usePersistentState('classroom_os_zhuyin_mode', false);

  // --- 硬體偵測：字型安裝狀態 ---
  const [fontInstalled, setFontInstalled] = useState(false);

  // 字型偵測邏輯 (直接搬過來)
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

  // 3. 打包所有功能
  const value = {
    currentAppId,
    setCurrentAppId,
    launcherPosition,
    setLauncherPosition,
    isGlobalZhuyin,
    setIsGlobalZhuyin,
    fontInstalled
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

// 4. 自訂 Hook (讓元件呼叫更方便)
export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};