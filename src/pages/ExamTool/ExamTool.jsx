import React, { useState, useEffect } from 'react';
import { AlertCircle, PlayCircle } from 'lucide-react';
import { useWakeLock } from './hooks/useWakeLock';
import { useExamLogic } from './hooks/useExamLogic';
import { useModalContext } from '../../context/ModalContext';
import { useClassroomContext } from '../../context/ClassroomContext';


import ExamSettingsModal from './components/ExamSettingsModal';
import ExamControlDock from './components/ExamControlDock';
import ExamMainStage from './components/ExamMainStage';
import QuickExamModal from './components/QuickExamModal';
import ManualAttendanceModal from './components/ManualAttendanceModal';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { UI_THEME, MODAL_ID } from '../../utils/constants';

const ExamTool = () => {
  useWakeLock();

  // 1. 從 Context 取得資料來源
  const {
    classes = [],
    currentClass,
    setCurrentClassId, // <--- 改用這個原名
    updateAttendance
  } = useClassroomContext();

  // 2. 取得測驗邏輯與自動計算的狀態
  const {
    schedule, setSchedule, ttsRules, setTtsRules,
    announcements, setAnnouncements,
    audioFiles, uploadAudio, removeAudio,
    attendanceStats, // 這裡已經包含 expected, actual, absentees
    currentStatus,
    setManualExtension,
    speak, isPlayingAudio, toggleAudio,
    isManualMode, setIsManualMode,
    manualData, setManualData,
    startQuickExam, // ★ 取得新函式
    stopQuickExam,  // ★ 取得新函式
    isQuickExam,
    isMuted, setIsMuted
  } = useExamLogic();

  // 3. UI 狀態管理
  const { openDialog, closeDialog, openModal } = useModalContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isQuickExamModalOpen, setIsQuickExamModalOpen] = useState(false);
  const toggleMute = () => setIsMuted(m => !m);

  // 當考試開始時自動收起側邊欄
  useEffect(() => {
    if (currentStatus.status === 'exam') setIsSidebarOpen(false);
  }, [currentStatus.status]);

  // ★★★ 新增：處理臨時測驗點擊 ★★★
  const handleQuickExam = () => {
    setIsQuickExamModalOpen(true);
  };

  const handleStopQuickExam = () => {
    openDialog({
      isOpen: true,
      title: '結束測驗',
      message: '確定要結束目前的臨時測驗嗎？',
      type: 'confirm',
      variant: 'danger',
      onConfirm: () => {
        stopQuickExam();
        closeDialog();
      },
      onClose: closeDialog
    });
  };

  // 4. 事件處理
  const handleExtend = () => {
    openDialog({
      isOpen: true,
      title: '延長考試時間',
      message: '請輸入要延長的分鐘數 (例如: 5)',
      type: 'prompt',
      onConfirm: (val) => {
        const mins = Number.parseInt(val, 10);
        if (Number.isFinite(mins)) setManualExtension(prev => prev + mins);
        closeDialog();
      },
      onClose: closeDialog,
    });
  };

  const toggleAnnouncements = () => {
    setAnnouncements(prev => ({
      ...prev,
      active: !prev.active
    }));
  };

  const sidebarCards = React.useMemo(() => {
    return schedule.map((slot) => {
      // 1. 判定是否正在考試 (只依賴 ID 與 Status)
      const isExamining = currentStatus.status === 'exam' && currentStatus.slot?.id === slot.id;

      // 2. 判定是否為下一節 (下課休息中，提示下一科)
      const isNextUp = currentStatus.status === 'break' && currentStatus.nextSlot?.id === slot.id;

      // 3. 決定樣式
      let cardClass = `relative p-4 rounded-xl border-2 transition-all duration-300 `;

      if (isExamining) {
        // 🔴 正在考試：深藍色、放大、陰影
        cardClass += "bg-blue-50 dark:bg-blue-900/40 border-blue-500 shadow-lg scale-105 z-10";
      } else if (isNextUp) {
        // 🟡 即將開始：琥珀色外框、呼吸燈效果
        cardClass += "bg-amber-50/50 dark:bg-amber-900/20 border-amber-400 border-dashed animate-pulse ring-2 ring-amber-100 dark:ring-amber-900/30";
      } else {
        // ⚪ 普通狀態
        cardClass += "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60 hover:opacity-100";
      }

      return (
        <div key={slot.id} className={cardClass}>
          {/* 狀態標籤 (Badge) */}
          {isExamining && (
            <div className="absolute -top-3 right-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
              <PlayCircle size={10} /> 進行中
            </div>
          )}
          {isNextUp && (
            <div className="absolute -top-3 right-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
              <AlertCircle size={10} /> 下一科
            </div>
          )}

          <div className="text-xs font-mono font-bold text-slate-400 mb-1">
            {slot.start} - {slot.end}
          </div>

          <div className={`font-bold text-lg leading-tight ${isExamining ? 'text-blue-700 dark:text-blue-300' : isNextUp ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}>
            {slot.name}
          </div>
        </div>
      );
    });
  }, [schedule, currentStatus.status, currentStatus.slot?.id, currentStatus.nextSlot?.id]);


  return (
    <div className={`w-full h-full flex overflow-hidden ${UI_THEME.BACKGROUND}`}>
      {/* Sidebar */}
      <div className={`relative transition-all duration-500 border-r ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="p-6 overflow-hidden min-w-[20rem]">
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}>
            <Clock className="text-blue-500" /> 今日考程
          </h2>

          <div className="mb-6">
            <label htmlFor="exam-class-selector" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              班級選擇
            </label>
            <select id="exam-class-selector" name="examClass"
              className={`w-full px-3 py-2 rounded-lg border ${UI_THEME.INPUT_BASE}`}
              // 這裡做一個特殊的 value 處理
              value={isManualMode ? 'manual-mode' : (currentClass?.id || '')}
              onChange={(e) => {
                if (e.target.value === 'manual-mode') {
                  setIsManualMode(true);
                } else {
                  setIsManualMode(false);
                  if (setCurrentClassId) setCurrentClassId(e.target.value);
                }
              }}
            >
              <option value="manual-mode">📝 手動輸入模式 (自定義)</option>
              <optgroup label="我的班級">
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </optgroup>
            </select>

            <div className="mt-2 text-xs text-slate-400">
              應到：{attendanceStats.expected}　實到：{attendanceStats.actual}
            </div>
          </div>

          <div className="space-y-4 pb-20">
            {sidebarCards}
          </div>
        </div>
      </div>


      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute bottom-15 left-0 z-100 -translate-y-1/2 bg-white dark:bg-slate-800 p-1 rounded-r-lg shadow-md border border-l-0 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 transition-all ease-in-out duration-500"
        style={{ left: isSidebarOpen ? '20rem' : '0' }}
      >
        {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>


      {/* Main Content */}
      <main className="flex-1 relative">
        <ExamMainStage
          statusData={currentStatus}
          isPlayingAudio={isPlayingAudio}
          toggleAudio={toggleAudio}
          attendanceStats={attendanceStats}
          onOpenAttendance={() => {
            if (isManualMode) setIsManualModalOpen(true);
            else openModal(MODAL_ID.ATTENDANCE);
          }}
          announcements={announcements}
        />
      </main>

      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        data={manualData}
        onSave={setManualData}
      />

      <ExamControlDock
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExtend={handleExtend}
        onQuickExam={handleQuickExam}
        onStopQuickExam={handleStopQuickExam}
        isQuickExam={isQuickExam}
        isTickerActive={announcements.active}
        onToggleTicker={toggleAnnouncements}
        isMuted={isMuted}
        toggleMute={toggleMute}
      />

      {/* Modals */}

      <ExamSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        schedule={schedule}
        setSchedule={setSchedule}
        ttsRules={ttsRules}
        setTtsRules={setTtsRules}
        announcements={announcements}
        setAnnouncements={setAnnouncements}
        uploadAudio={uploadAudio}
        removeAudio={removeAudio}
        audioFiles={audioFiles}
      />

      <QuickExamModal
        isOpen={isQuickExamModalOpen}
        onClose={() => setIsQuickExamModalOpen(false)}
        onConfirm={(mins, title) => {
          startQuickExam(mins, title); // 傳遞時間與標題給 Logic
        }}
      />

    </div>
  );
};

export default ExamTool;