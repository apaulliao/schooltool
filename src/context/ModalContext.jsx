import React, { createContext, useContext } from 'react';
import { useModalManager } from '../hooks/useModalManager';

// 建立 Context
const ModalContext = createContext(null);

// 建立 Provider
export const ModalProvider = ({ children }) => {
  // 使用我們之前寫好的 Hook
  const modalManager = useModalManager();

  return (
    <ModalContext.Provider value={modalManager}>
      {children}
    </ModalContext.Provider>
  );
};

// 建立 Custom Hook 方便子組件使用
export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};