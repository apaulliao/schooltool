import React, { useState, useEffect, useMemo } from 'react'; 
import { 
  Plus, Users, Settings, FileText, Link as LinkIcon, 
  Copy, CheckCircle2, AlertCircle, Loader2, Calendar, Lock, Trash2, Edit3,
  ChevronDown, ChevronRight, CheckSquare, Square, Printer
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { useCaseLog } from '../context/CaseLogContext';
import { useModalContext } from '../../../context/ModalContext';
import DialogModal from '../../../components/common/DialogModal';
import TemplateEditor from '../components/TemplateEditor';
import LogForm from '../components/LogForm';

export default function TeacherDashboard() {
  const { setAlertDialog } = useModalContext();

  const {
    students,
    activeStudent,
    activeStudentId,
    activeTemplate,
    logs,
    isLoading,
    isSyncing,
    error,
    setActiveStudentId,
    createStudentProfile,
    addLogEntry,
    saveTemplate,
    generateParentLink,
    clearError,
    deleteStudentProfile,
    updateLogEntry,
    deleteSingleLog
  } = useCaseLog();

  // 視圖切換 ('logs' | 'template')
  const [activeTab, setActiveTab] = useState('logs');
  
  // 🌟 目前選取的日誌 ID ('new' 代表正在新增，其他字串代表檢視舊紀錄)
  const [selectedLogId, setSelectedLogId] = useState('new');
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // ==========================================
  // 🌟 階段一：月份摺疊清單邏輯
  // ==========================================
  const [expandedMonths, setExpandedMonths] = useState({});

  // 透過 useMemo 自動將 logs 轉換為以「YYYY年MM月」為單位的群組
  const groupedLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    const groups = {};
    logs.forEach(log => {
      const [year, month] = log.date.split('-');
      const monthKey = `${year}年${month}月`;
      
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(log);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        month: key,
        logs: groups[key]
      }));
  }, [logs]);

  // 當切換學生時，自動展開「最新的一個月」，其餘摺疊
  useEffect(() => {
    if (groupedLogs.length > 0) {
      setExpandedMonths({ [groupedLogs[0].month]: true });
    } else {
      setExpandedMonths({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudentId]);

  // 切換特定月份的展開/摺疊狀態
  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // 對話框狀態
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [shareLinkData, setShareLinkData] = useState({ isOpen: false, link: '', copied: false });

  // 當切換學生或選取不同日誌時，重置編輯狀態
  useEffect(() => {
    setIsEditingMode(false);
  }, [selectedLogId, activeStudentId]);

  // 處理新增學生
  const handleCreateStudent = async (studentName) => {
    if (!studentName.trim()) return false;
    try {
      await createStudentProfile(studentName.trim());
      setIsAddStudentOpen(false); 
      setActiveTab('template');
      return true;
    } catch (err) {
      if (err.message === 'TokenExpired' || err.message === '未登入') {
        setIsAddStudentOpen(false); 
      }
      return false; 
    }
  };
  
  // ==========================================
  // 🌟 階段二：批次選取模式邏輯
  // ==========================================
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState([]);

  // 當切換學生時，自動關閉選取模式並清空選取清單
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedLogIds([]);
  }, [activeStudentId]);

  // 切換單一日誌的選取狀態
  const toggleSelectLog = (logId, e) => {
    e.stopPropagation(); 
    setSelectedLogIds(prev => 
      prev.includes(logId) ? prev.filter(id => id !== logId) : [...prev, logId]
    );
  };

  // 全選 / 取消全選該學生的所有日誌
  const handleSelectAll = () => {
    if (selectedLogIds.length === logs.length) {
      setSelectedLogIds([]); 
    } else {
      setSelectedLogIds(logs.map(log => log.id)); 
    }
  };  

  // 處理產生家長連結與複製
  const handleGenerateLink = async () => {
    try {
      const baseLink = await generateParentLink();
      
      // 🌟 修正：抓取已勾選日誌的「時間戳記 (timestamp)」，並做 URL 編碼確保安全
      const selectedTimestamps = logs
        .filter(log => selectedLogIds.includes(log.id))
        .map(log => encodeURIComponent(log.timestamp));

      // 🌟 改用 tms (timestamps的縮寫) 當作參數名稱
      const finalLink = (isSelectionMode && selectedLogIds.length > 0)
        ? `${baseLink}&tms=${selectedTimestamps.join(',')}`
        : baseLink;

      setShareLinkData({ isOpen: true, link: finalLink, copied: false });
    } catch (err) {}
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLinkData.link);
      setShareLinkData(prev => ({ ...prev, copied: true }));
      setTimeout(() => setShareLinkData(prev => ({ ...prev, copied: false })), 2000);
    } catch (err) {
      console.error('複製失敗', err);
    }
  };

  // ==========================================
  // 🌟 渲染區塊：右側的舊日誌詳細內容
  // ==========================================
  const renderLogDetail = () => {
    const log = logs.find(l => l.id === selectedLogId);
    if (!log) return null;

    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className={`p-6 rounded-2xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} shadow-sm`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${UI_THEME.TEXT_PRIMARY} mb-2 flex items-center gap-2`}>
                <Calendar className={UI_THEME.TEXT_SECONDARY} />
                {log.date}
              </h2>
              <div className={`flex items-center gap-3 text-sm ${UI_THEME.TEXT_MUTED}`}>
                <span className="flex items-center gap-1"><Users size={14}/> {log.author}</span>
                <span>•</span>
                <span>建立於 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingMode(true)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <Edit3 size={16} /> 編輯
              </button>
              <button 
                onClick={() => {
                  setAlertDialog({
                    isOpen: true, title: '刪除單篇日誌',
                    message: `確定要刪除這篇 ${log.date} 的紀錄嗎？\n此動作將無法復原。`,
                    type: 'confirm', variant: 'danger', confirmText: '刪除中...', isBusy: isSyncing,
                    onConfirm: async () => {
                      setAlertDialog(prev => ({ ...prev, isBusy: true }));
                      await deleteSingleLog(log.id);
                      setSelectedLogId('new'); 
                      setAlertDialog(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"
              >
                <Trash2 size={16} /> 刪除
              </button>
            </div>
          </div>

          <hr className={`border-t ${UI_THEME.BORDER_DEFAULT} my-4`} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            {log.template?.map(block => {
              const val = log.content[block.id];
              if (val === undefined || val === '') return null;
              const isFullWidth = block.type === 'text' || block.type === 'image';

              return (
                <div key={block.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                  <span className={`text-sm font-bold ${UI_THEME.TEXT_MUTED}`}>{block.label}</span>
                  <div className={`text-base font-medium ${UI_THEME.TEXT_PRIMARY} whitespace-pre-wrap`}>
                    {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {log.privateNote && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <Lock size={18} />
              <span className="font-bold">內部備註 (家長不可見)</span>
            </div>
            <p className="text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
              {log.privateNote}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
  <>
    <div className={`flex h-full w-full overflow-hidden ${UI_THEME.BACKGROUND} print:hidden`}>
      
      {/* ================= 左欄：學生清單 ================= */}
      <div className={`w-64 shrink-0 flex flex-col border-r z-10 ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN}`}>
        <div className={`p-4 border-b ${UI_THEME.BORDER_DEFAULT} flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <Users className={UI_THEME.TEXT_PRIMARY} size={20} />
            <h2 className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>個案名單</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : students.length === 0 ? (
            <div className={`text-sm text-center p-4 ${UI_THEME.TEXT_MUTED}`}>尚無學生資料</div>
          ) : (
            students.map(student => (
              <button
                key={student.id}
                onClick={() => setActiveStudentId(student.id)}
                className={`flex items-center justify-between p-3 rounded-xl text-left font-bold transition-all ${
                  activeStudentId === student.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : `hover:bg-slate-100 dark:hover:bg-slate-800 ${UI_THEME.TEXT_PRIMARY}`
                }`}
              >
                <span>{student.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setIsAddStudentOpen(true)}
            disabled={isSyncing}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold ${UI_THEME.BTN_SECONDARY}`}
          >
            <Plus size={18} /> 新增個案
          </button>
        </div>
      </div>

      {/* ================= 右側主畫面容器 ================= */}
      <div className={`flex-1 flex flex-col relative min-w-0 ${UI_THEME.CONTENT_AREA}`}>
        
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white shadow-lg font-bold text-sm animate-in slide-in-from-top-4">
            <AlertCircle size={16} />
            {error}
            <button onClick={clearError} className="ml-2 hover:text-rose-200">✕</button>
          </div>
        )}	
        {/* 頂部控制列 */}
        {activeStudent ? (
          <div className={`px-6 py-4 flex flex-wrap items-center justify-between border-b gap-4 ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS}`}>
            <div className="flex items-center gap-4">
              <h1 className={`text-xl font-bold truncate max-w-[200px] ${UI_THEME.TEXT_PRIMARY}`}>{activeStudent.name} 的日誌</h1>
              {isSyncing && <Loader2 className="animate-spin text-slate-400" size={16} />}
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'logs' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY
                }`}
              >
                <FileText size={16} /> 日誌管理
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'template' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY
                }`}
              >
                <Settings size={16} /> 模板設定
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateLink}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 ${UI_THEME.BTN_PRIMARY}`}
              >
                <LinkIcon size={16} /> 產生家長連結
              </button>
              
              <button
                onClick={() => {
                  setAlertDialog({
                    isOpen: true,
                    title: '刪除個案檔案',
                    message: `確定要刪除 ${activeStudent.name} 的日誌嗎？\n此動作將清除雲端試算表與系統紀錄。`,
                    type: 'confirm',
                    variant: 'danger',
                    confirmText: '刪除中...',
                    isBusy: isSyncing,
                    onConfirm: async () => {
                      setAlertDialog(prev => ({ ...prev, confirmText: '刪除中...', isBusy: true }));
                      await deleteStudentProfile(activeStudent.id, true);
                    }
                  });
                }}
                disabled={isSyncing}
                className={`p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors`}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <Users size={64} className="mb-4 text-slate-400" />
            <h2 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY}`}>請從左側選擇或新增個案</h2>
          </div>
        )}

        {/* ================= 內容渲染區塊 ================= */}
        {activeStudent && (
          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'template' ? (
              <div className="flex-1 overflow-y-auto p-6">
                 <TemplateEditor 
                  initialTemplate={activeTemplate} 
                  onSave={async (newTemplate) => {
                    await saveTemplate(newTemplate);
                    setActiveTab('logs'); 
                  }} 
                 />
              </div>
            ) : (
              <>
                {/* 🌟 中欄：日誌選單 (包含正確的範圍與相對定位) */}
                <div className={`w-80 shrink-0 flex flex-col border-r ${UI_THEME.BORDER_DEFAULT} bg-slate-50/30 dark:bg-slate-900/30 relative`}>
                  
                  {/* 中欄頂部：控制列 */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                    <button
                      onClick={() => setSelectedLogId('new')}
                      disabled={isSelectionMode}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                        selectedLogId === 'new' && !isSelectionMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      <Plus size={18} /> 撰寫新日誌
                    </button>
                    
                    {logs.length > 0 && (
                      <div className="flex items-center justify-between px-1">
                        <button
                          onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) setSelectedLogIds([]);
                          }}
                          className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${
                            isSelectionMode ? 'text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY + ' hover:text-blue-500'
                          }`}
                        >
                          {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                          {isSelectionMode ? '取消選取模式' : '批次選取'}
                        </button>

                        {isSelectionMode && (
                          <button
                            onClick={handleSelectAll}
                            className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} hover:text-blue-500 underline`}
                          >
                            {selectedLogIds.length === logs.length ? '取消全選' : '全選'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* 中欄內容：摺疊清單 */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    {groupedLogs.length === 0 ? (
                      <div className={`text-sm text-center p-8 ${UI_THEME.TEXT_MUTED} font-bold`}>尚無歷史紀錄</div>
                    ) : (
                      groupedLogs.map(group => (
                        <div key={group.month} className="flex flex-col gap-1.5">
                          <button
                            onClick={() => toggleMonth(group.month)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-bold transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 ${UI_THEME.TEXT_SECONDARY}`}
                          >
                            <div className="flex items-center gap-1.5">
                              {expandedMonths[group.month] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{group.month}</span>
                            </div>
                            <span className="text-xs opacity-60 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {group.logs.length} 篇
                            </span>
                          </button>

                          {expandedMonths[group.month] && (
                            <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 pl-1 border-l-2 border-slate-200/50 dark:border-slate-800/50 ml-2.5">
                              {group.logs.map(log => {
                                const isSelected = selectedLogIds.includes(log.id);
                                return (
                                  <button
                                    key={log.id}
                                    onClick={(e) => isSelectionMode ? toggleSelectLog(log.id, e) : setSelectedLogId(log.id)}
                                    className={`relative p-3 rounded-xl text-left border transition-all ml-1.5 ${
                                      isSelectionMode && isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-sm' 
                                        : selectedLogId === log.id && !isSelectionMode
                                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                                          : `border-transparent hover:bg-white dark:hover:bg-slate-800 ${UI_THEME.TEXT_PRIMARY}`
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-1 gap-2">
                                      <div className="flex items-center gap-2">
                                        {isSelectionMode && (
                                          <div className={`shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                          </div>
                                        )}
                                        <span className="font-bold text-sm">{log.date}</span>
                                      </div>
                                      <span className={`text-xs shrink-0 mt-0.5 ${UI_THEME.TEXT_MUTED}`}>
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className={`text-xs ${UI_THEME.TEXT_SECONDARY} truncate flex items-center gap-1.5 ${isSelectionMode ? 'pl-6' : ''}`}>
                                      <Users size={12} /> {log.author}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* 🌟 底部浮動操作列 (已補回) */}
                  {isSelectionMode && selectedLogIds.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4">
                      <div className="bg-slate-800 dark:bg-slate-100 rounded-2xl p-3 shadow-xl flex items-center justify-between">
                        <span className="text-white dark:text-slate-900 text-sm font-bold pl-2">
                          已選 {selectedLogIds.length} 篇
                        </span>
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                          <Printer size={16} /> 列印/匯出
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右欄：主畫面 */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50">
                  {selectedLogId === 'new' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <LogForm 
                        template={activeTemplate} 
                        onSubmit={addLogEntry} 
                        isSubmitting={isSyncing} 
                      />
                    </div>
                  ) : isEditingMode ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <LogForm 
                        template={activeTemplate} 
                        initialData={logs.find(l => l.id === selectedLogId)} 
                        onCancel={() => setIsEditingMode(false)}
                        onSubmit={async (data) => {
                          await updateLogEntry(selectedLogId, data);
                          setIsEditingMode(false); 
                        }} 
                        isSubmitting={isSyncing} 
                      />
                    </div>
                  ) : (
                    renderLogDetail()
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
	</div>
	
      {/* 對話框 (新增學生 & 產生連結) */}
      <DialogModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="新增個案"
        message="請輸入學生姓名。系統將自動在您的 Google Drive 建立一份專屬的紀錄試算表 (Sheet)。"
        type="prompt"
        placeholder="例如: 王小明"
        confirmText={isSyncing ? "建立檔案中..." : "建立檔案"}
        onConfirm={handleCreateStudent}
        isBusy={isSyncing}
      />

      {shareLinkData.isOpen && (
        <div className="fixed inset-0 z-[20001] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="text-blue-500" size={24} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">家長唯讀連結</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              請複製以下專屬連結並傳送給家長。該連結具備唯讀權限，且家長無法看見「內部備註」。
            </p>
            <div className="flex items-center gap-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={shareLinkData.link}
                className={`flex-1 p-3 text-sm rounded-lg border ${UI_THEME.BORDER_DEFAULT} bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 outline-none`}
              />
              <button 
                onClick={copyToClipboard}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                  shareLinkData.copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/50'
                }`}
              >
                {shareLinkData.copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <div className="flex justify-end">
               <button onClick={() => setShareLinkData({ isOpen: false, link: '', copied: false })} className={UI_THEME.BTN_PRIMARY}>
                 關閉
               </button>
            </div>
          </div>
        </div>
      )}
	  
	  {/* ========================================== */}
      {/* 🌟 4. 階段三新增：隱藏的列印專屬版面 (A4 格式) */}
      {/* ========================================== */}
      <div className="hidden print:block w-full bg-white text-black font-sans">
        <h1 className="text-3xl font-bold text-center mb-6 pb-4 border-b-2 border-black">
          {activeStudent?.name} - 個案紀錄日誌
        </h1>
        
        <div className="flex flex-col gap-8">
          {logs
            .filter(log => selectedLogIds.includes(log.id)) // 只撈出有打勾的日誌
            .map(log => (
              <div key={log.id} className="break-inside-avoid border border-gray-300 p-6 rounded-lg">
                
                {/* 列印版標頭 */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar size={20} />
                    {log.date}
                  </h2>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Users size={16} /> {log.author}
                  </span>
                </div>
                
                {/* 列印版內容 */}
                <div className="grid grid-cols-2 gap-4">
                  {log.template?.map(block => {
                    const val = log.content[block.id];
                    if (val === undefined || val === '') return null;
                    const isFullWidth = block.type === 'text' || block.type === 'image';

                    return (
                      <div key={block.id} className={`flex flex-col gap-1 ${isFullWidth ? 'col-span-2' : ''}`}>
                        <span className="text-sm font-bold text-gray-500">{block.label}</span>
                        <div className="text-base font-medium whitespace-pre-wrap">
                          {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 備註：列印版預設不印出「內部備註」，保護教師隱私 */}
              </div>
          ))}
        </div>
      </div>      
	</>
  );
}