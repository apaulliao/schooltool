import { useState, useCallback } from 'react';

/**
 * 整合所有彈窗狀態的管理 Hook
 */
export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState(null); // 記錄目前開啟的 Modal ID
  const [modalData, setModalData] = useState(null);     // 傳遞給 Modal 的暫存資料

  // 開啟特定的 Modal
  const openModal = useCallback((modalId, data = null) => {
    setActiveModal(modalId);
    setModalData(data);
  }, []);

  // 關閉 Modal
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    // 輔助判斷函式
    isModalOpen: (modalId) => activeModal === modalId
  };
};