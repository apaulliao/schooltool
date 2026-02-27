import React, { createContext, useContext } from 'react';
import { useModalManager } from '../hooks/useModalManager';
// 🌟 1. 引入 DialogModal 元件 (請確認您的相對路徑是否正確)
import DialogModal from '../components/common/DialogModal';

// 建立 Context
const ModalContext = createContext(null);

// 建立 Provider
export const ModalProvider = ({ children }) => {
  // 使用我們之前寫好的 Hook
  const modalManager = useModalManager();

  return (
    <ModalContext.Provider value={modalManager}>
      {children}
      
      {/* 🌟 2. 新增這段：負責把全域的 Dialog 真正渲染到畫面上 */}
      {modalManager.dialogConfig && modalManager.dialogConfig.isOpen && (
        <DialogModal
          {...modalManager.dialogConfig}
          onClose={() => {
            // 如果呼叫端有傳入自訂的 onClose，就執行它
            if (modalManager.dialogConfig.onClose) {
              modalManager.dialogConfig.onClose();
            }
            // 關閉彈窗 (清空狀態)
            modalManager.closeDialog(); 
          }}
        />
      )}
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