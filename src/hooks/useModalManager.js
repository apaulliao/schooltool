import { useState, useCallback } from 'react';

/**
 * 整合所有彈窗狀態的管理 Hook
 */
export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState(null); 
  const [modalData, setModalData] = useState(null);     

  const openModal = useCallback((modalId, data = null) => {
    setActiveModal(modalId);
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const [dialogConfig, setDialogConfig] = useState(null); 

  const openDialog = useCallback((config) => {
    setDialogConfig(config);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogConfig(null);
  }, []);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    isModalOpen: (modalId) => activeModal === modalId,

    dialogConfig,
    openDialog,
    closeDialog,
    // 🌟 關鍵修正：將 setDialogConfig 取個小名叫做 setAlertDialog 匯出
    setAlertDialog: setDialogConfig 
  };
};