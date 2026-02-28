import React, { useRef, useEffect, useCallback } from 'react';
import { Settings2, Trophy } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

// --- 引入 Hooks 與 Constants ---
// 路徑修正：跳出兩層到 src 根目錄
import { useStudentImport } from '../../hooks/useStudentImport';
import { useManagerUI } from '../../hooks/useManagerUI';
import { UI_THEME, MODAL_ID } from '../../utils/constants';

// --- 引入 Context ---
import { ClassroomProvider, useClassroomContext } from '../../context/ClassroomContext';
import { ModalProvider, useModalContext } from '../../context/ModalContext';

// --- 引入 UI 組件 (Manager Local) ---
// 路徑修正：同層級 (Manager) 下的 components
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import ScoreFeedback from './components/ScoreFeedback';
import GroupScoreTicker from './components/GroupScoreTicker';
import SeatGrid from './components/SeatGrid';

// --- 引入 Widgets (Common) ---
// 路徑修正：跳出兩層到 src/components/common/widgets
import TimerWidget from '../../components/common/widgets/TimerWidget';
import LotteryWidget from '../../components/common/widgets/LotteryWidget';
import SoundBoard from '../../components/common/widgets/SoundBoard';

// --- 引入 Common Modals ---

const Manager = () => {
  const {
    currentClass,
    updateClass, saveTemplate, deleteTemplate, applyTemplate,
    toggleLock, toggleVoid, seatDrop, sidebarDrop, updateStudent,
    updateStudents, scoreStudent, resetScores, updateBehaviors, updateAttendance,
    templates, feedbacks, undo, redo, canUndo, canRedo,
    seatMode, setSeatMode
  } = useClassroomContext();

  const { parseImportText } = useStudentImport();

  const {
    activeModal, modalData, openModal, closeModal, isModalOpen,
    dialogConfig, openDialog, closeDialog
  } = useModalContext();

  const {
    state: {
      isTeacherView, isEditingList, showShuffleMenu, displayMode, appMode,
      isSidebarOpen, sidebarTab, isToolbarOpen, isSoundBoardOpen, isTimerOpen,
      isLotteryOpen, isScoreTickerOpen, isFocusMode, batchScoreMode, hoveredGroup, scale
    },
    setters: {
      setIsTeacherView, setIsEditingList, setShowShuffleMenu, setDisplayMode, setAppMode,
      setIsSidebarOpen, setSidebarTab, setIsToolbarOpen, setIsSoundBoardOpen, setIsTimerOpen,
      setIsLotteryOpen, setIsScoreTickerOpen, setIsFocusMode, setBatchScoreMode, setHoveredGroup
    },
    actions: {
      handleSwitchMode, cycleDisplayMode, getDisplayModeLabel, toggleBatchMode
    },
    refs: {
      gridRef, containerRef
    }
  } = useManagerUI({
    currentClass, activeModal, closeModal, dialogConfig, closeDialog,
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    },
    canUndo, undo, canRedo, redo, setSeatMode
  });

  const today = new Date().toLocaleDateString('en-CA');
  const currentAttendanceStatus = currentClass?.attendanceRecords?.[today] || {};

  // --- 業務處理邏輯 ---
  const handleImportList = (text) => {
    const newStudents = parseImportText(text);
    if (newStudents.length > 0) {
      openDialog({
        type: 'confirm',
        title: '確認匯入名單',
        message: `成功解析 ${newStudents.length} 筆資料。\n這將重置座位表，確定嗎？`,
        onConfirm: () => {
          updateClass({
            ...currentClass,
            students: newStudents,
            layout: { ...currentClass.layout, seats: {}, voidSeats: [] },
            scoreLogs: []
          });
          setIsEditingList(false);
          closeDialog();
        }
      });
    } else {
      openDialog({
        type: 'alert',
        title: '格式錯誤',
        message: '無法解析資料，請檢查格式是否包含：座號 姓名'
      });
    }
  };

  const handleStudentClick = useCallback((student) => {
    if (!student) return;
    if (batchScoreMode) {
      const value = batchScoreMode === 'add' ? 1 : -1;
      scoreStudent(student.id, { id: 'batch_quick', value, score: value, label: value > 0 ? '快速加分' : '快速扣分', type: value > 0 ? 'positive' : 'negative', isQuick: true }, 'individual');
      return;
    }
    if (appMode === 'arrange') { openModal(MODAL_ID.EDIT_STUDENT, student); return; }
    if (appMode === 'score') { openModal(MODAL_ID.SCORING, student); }
  }, [batchScoreMode, appMode, scoreStudent, openModal]);

  const handleExportImage = async () => {
    if (!gridRef.current) return;

    openModal(MODAL_ID.DIALOG, {
      type: 'alert',
      title: '影像處理中',
      message: '正在產生高品質座位表（4x 採樣），這可能需要幾秒鐘...'
    });

    try {
      const dataUrl = await htmlToImage.toPng(gridRef.current, {
        pixelRatio: 4,
        quality: 1.0,
        filter: (node) => {
          const classList = node.classList;
          return classList ? !classList.contains('no-print') : true;
        }
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${currentClass.name}_座位表_HD.png`;
      link.click();
      closeModal();
    } catch (error) {
      console.error("匯出失敗:", error);
      openModal(MODAL_ID.DIALOG, {
        type: 'alert',
        title: '匯出失敗',
        message: '請確認瀏覽器支援快照功能，或嘗試縮小視窗後再試一次。'
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className={`flex h-full ${UI_THEME.BACKGROUND} transition-colors duration-500 overflow-hidden font-sans`}>

      <ScoreFeedback feedbacks={feedbacks} mode="" />


      {/* 詳細模式開關 */}
      {(isFocusMode || (!isSidebarOpen && !isToolbarOpen)) && (
        <div className="absolute top-3 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 no-print print:hidden">
          <button
            onClick={() => { setIsFocusMode(false); setIsSidebarOpen(true); setIsToolbarOpen(true); }}
            className="px-4 py-2 bg-white/90 dark:bg-blue-900/50 backdrop-blur text-blue-600 dark:text-blue-200 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-blue-50 hover:dark:bg-blue-500/50 hover:scale-105 transition-all border border-blue-200 dark:border-blue-500"
          >
            <Settings2 size={18} /> <span className="font-bold">詳細模式</span>
          </button>
        </div>
      )}

      {/* 評分工具開關 */}
      {!isScoreTickerOpen && (isFocusMode || !isToolbarOpen) && (
        <div className="absolute top-15 right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 no-print print:hidden">
          <button
            onClick={() => setIsScoreTickerOpen(true)}
            className="px-4 py-2 bg-white/90 dark:bg-amber-900/50 backdrop-blur text-amber-600 dark:text-amber-200 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-amber-50 hover:dark:bg-amber-500/50 hover:scale-105 transition-all border border-amber-200 dark:border-amber-500 shadow-amber-100/50 dark:shadow-amber-700/50"
          >
            <Trophy size={18} /> 評分工具
          </button>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen && !isFocusMode} onClose={() => setIsSidebarOpen(false)}
        activeTab={sidebarTab} setActiveTab={setSidebarTab} isEditingList={isEditingList} setIsEditingList={setIsEditingList}
        displayMode={displayMode} appMode={appMode} onStudentClick={handleStudentClick}
        onDragStart={(e, id) => e.dataTransfer.setData("studentId", id)} onDrop={sidebarDrop} onImportList={handleImportList}
      />

      <div className={`flex-1 flex flex-col relative overflow-hidden ${UI_THEME.CONTENT_AREA} transition-all duration-500`}>
        <Toolbar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          isToolbarOpen={isToolbarOpen && !isFocusMode} setIsToolbarOpen={setIsToolbarOpen}
          appMode={appMode} handleSwitchMode={handleSwitchMode}
          showShuffleMenu={showShuffleMenu} setShowShuffleMenu={setShowShuffleMenu}
          cycleDisplayMode={cycleDisplayMode}
          getDisplayModeLabel={getDisplayModeLabel}
          handleExportImage={handleExportImage} toggleFullscreen={toggleFullscreen}

          setIsLotteryOpen={setIsLotteryOpen} setIsTimerOpen={setIsTimerOpen}
          isLotteryOpen={isLotteryOpen} isTimerOpen={isTimerOpen}
          isTeacherView={isTeacherView} setIsTeacherView={setIsTeacherView}
          isSoundBoardOpen={isSoundBoardOpen} setIsSoundBoardOpen={setIsSoundBoardOpen}
          isScoreTickerOpen={isScoreTickerOpen} setIsScoreTickerOpen={setIsScoreTickerOpen}
          isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
        />

        <GroupScoreTicker
          groupScores={currentClass?.groupScores} students={currentClass?.students}
          isVisible={isScoreTickerOpen && appMode === 'score'} onClose={() => setIsScoreTickerOpen(false)}
          batchScoreMode={batchScoreMode} onToggleBatchMode={toggleBatchMode}
          onQuickScore={(groupId, value) => scoreStudent(groupId, { id: 'group_quick', value, score: value, type: value > 0 ? 'positive' : 'negative', isQuick: true }, 'group')}
          onDetailScore={(groupId) => openModal(MODAL_ID.SCORING, { mode: 'group_members', group: groupId, name: `第 ${groupId} 組 (全員)` })}
          onClassScore={() => openModal(MODAL_ID.SCORING, { mode: 'class', name: '全班同學' })}

        />

        <LotteryWidget isOpen={isLotteryOpen} onClose={() => setIsLotteryOpen(false)} classes={currentClass ? [currentClass] : []} defaultClassId={currentClass?.id} attendanceStatus={currentAttendanceStatus} />
        <TimerWidget isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} students={currentClass?.students} attendanceStatus={currentAttendanceStatus} />
        <SoundBoard isOpen={isSoundBoardOpen} onClose={() => setIsSoundBoardOpen(false)} />

        <div ref={containerRef} className={`flex-1 p-4 md:p-8 flex flex-col items-center justify-center overflow-auto ${batchScoreMode ? 'cursor-crosshair' : ''}`}>
          <div className="flex flex-col items-center w-full max-w-6xl" ref={gridRef}>
            <div className={`w-full max-w-4xl h-10 mb-6 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-lg transition-all duration-500 ${isTeacherView ? 'bg-slate-500 dark:bg-slate-700' : 'bg-slate-700 dark:bg-slate-800 border border-slate-600'}`}>
              {isTeacherView ? '教室後方 / 布告欄' : '講台 / 黑板'}
            </div>

            <div className={`relative ${UI_THEME.SURFACE_GLASS} rounded-3xl shadow-2xl p-8 md:p-12 border-4 ${UI_THEME.BORDER_LIGHT} max-w-5xl w-full mx-auto flex-1 flex flex-col overflow-hidden`}>
              <SeatGrid
                layout={currentClass?.layout}
                students={currentClass?.students || []}
                isTeacherView={isTeacherView}
                onSeatDrop={seatDrop}
                onStudentClick={handleStudentClick}
                displayMode={displayMode}
                appMode={appMode}
                attendanceStatus={currentAttendanceStatus}
                onToggleVoid={toggleVoid}
                onToggleLock={toggleLock}
                hoveredGroup={hoveredGroup}
              />
            </div>

            <div className={`w-full max-w-4xl h-10 mt-6 rounded-xl flex items-center justify-center text-white font-bold tracking-widest shadow-lg transition-all duration-500 ${isTeacherView ? 'bg-slate-700 dark:bg-slate-800 border border-slate-600' : 'bg-slate-500 dark:bg-slate-700'}`}>
              {isTeacherView ? '講台 / 黑板' : '教室後方 / 布告欄'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manager;