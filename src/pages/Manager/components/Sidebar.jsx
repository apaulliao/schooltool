import React, { useState } from 'react';
import { Users, BarChart3, PanelLeftClose, RotateCcw, RotateCw } from 'lucide-react';
import GlobalBackupModal from '../../../components/common/GlobalBackupModal';
import { useClassroomContext } from '../../../context/ClassroomContext';
import { UI_THEME } from '../../../utils/constants';

// 引入拆分後的組件
import ManagementTab from './sidebar/ManagementTab';
import ScoresTab from './sidebar/ScoresTab';

const Sidebar = ({
  // UI 狀態
  isOpen, onClose,
  activeTab, setActiveTab,
    
  // 未排座位區 (仍需傳遞，因為涉及 UI 互動)
  isEditingList, setIsEditingList, 
  onImportList,
  onStudentClick, onDragStart, 
  onDrop, 
  
  // 顯示設定
  displayMode, appMode
  
  // ★ 移除所有 onOpenXxx 和 onShowDialog props
}) => {
  const { undo, redo, canUndo, canRedo } = useClassroomContext();
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={`${UI_THEME.SURFACE_MAIN} border-r ${UI_THEME.BORDER_DEFAULT} flex flex-col shadow-lg z-20 shrink-0 transition-all duration-300 ease-in-out relative no-print ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full border-r-0 opacity-0 overflow-hidden'}`}>
        <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
        
        <div className="w-80 h-full flex flex-col">
          {/* Tabs 區域 */}
          <div className={`flex border-b ${UI_THEME.BORDER_LIGHT} bg-slate-50 dark:bg-slate-800`}>
              <button onClick={() => setActiveTab('management')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'management' ? `${UI_THEME.SURFACE_MAIN} text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400` : `${UI_THEME.TEXT_SECONDARY} hover:bg-slate-100 dark:hover:bg-slate-700`}`}><Users size={16}/> 班級管理</button>
              <button onClick={() => setActiveTab('scores')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'scores' ? `${UI_THEME.SURFACE_MAIN} text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400` : `${UI_THEME.TEXT_SECONDARY} hover:bg-slate-100 dark:hover:bg-slate-700`}`}><BarChart3 size={16}/> 分數統計</button>
              <button onClick={onClose} className={`px-3 ${UI_THEME.TEXT_MUTED} hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-l ${UI_THEME.BORDER_DEFAULT}`}><PanelLeftClose size={16}/></button>
          </div>
          
          {/* 內容區域：根據 Tab 渲染不同組件 */}
          {/* ★ Props 大瘦身！ */}
          {activeTab === 'management' ? (
              <ManagementTab 
                  isEditingList={isEditingList}
                  setIsEditingList={setIsEditingList}
                  onImportList={onImportList}
                  onStudentClick={onStudentClick}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  onOpenBackup={() => setIsBackupOpen(true)} // 備份功能保留本地控制
                  displayMode={displayMode}
                  appMode={appMode}
              />
          ) : (
              <ScoresTab />
          )}
          
          {/* Footer 區域 (全域共用) */}
          <div className={`p-4 pl-20 border-t ${UI_THEME.BORDER_LIGHT} bg-slate-50 dark:bg-slate-800 flex items-center justify-between pb-6`}>
             <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} whitespace-nowrap`}>操作紀錄</span>
             <div className="flex gap-2">
                 <button onClick={undo} disabled={!canUndo} className={`p-2 ${UI_THEME.BTN_SECONDARY} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed`} title="復原 (Undo)"><RotateCcw size={16}/></button>
                 <button onClick={redo} disabled={!canRedo} className={`p-2 ${UI_THEME.BTN_SECONDARY} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed`} title="重做 (Redo)"><RotateCw size={16}/></button>
             </div>
          </div>
        </div>
    </div>
  );
};

export default Sidebar;