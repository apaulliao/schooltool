import React, { useState, useEffect } from 'react';
import { Star, Upload, Send, Lock, X, FileText, Edit3, Calendar, Save, Trash2, Trash } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

const getLocalToday = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000; 
  return new Date(Date.now() - tzOffset).toISOString().split('T')[0];
};

export default function LogForm({ 
  template = [], 
  onSubmit,
  onSaveDraft,
  onDeleteDraft,  
  isSubmitting = false, 
  initialData = null, // 🌟 新增 prop
  onCancel = null,     // 🌟 新增 prop
  activeStudentId, // 🌟 接收學生 ID 作為草稿的獨立 Key
  logId = 'new'
}) {
  // 🌟 1. 保持您原本的變數名稱，並讓初始值優先讀取 initialData
  const [formData, setFormData] = useState(initialData?.content || {});
  const [privateNote, setPrivateNote] = useState(initialData?.privateNote || '');
  const [attachments, setAttachments] = useState(initialData?.attachments || []);
  const [logDate, setLogDate] = useState(initialData?.date || getLocalToday());
  const [bufferStatus, setBufferStatus] = useState(null);
  
  useEffect(() => {
    const bufferKey = `caselog_buffer_${activeStudentId}_${logId}`;
    const bufferStr = localStorage.getItem(bufferKey);

    if (bufferStr) {
      try {
        const buffer = JSON.parse(bufferStr);
        setFormData(buffer.formData || {});
        setPrivateNote(buffer.privateNote || '');
        setLogDate(buffer.logDate || initialData?.date || getLocalToday());
        setAttachments(initialData?.attachments || []); 
        setBufferStatus('已復原尚未儲存的輸入內容');
      } catch (e) {
        console.error('緩衝區解析失敗', e);
      }
    } else if (initialData) {
      setFormData(initialData.content || {});
      setPrivateNote(initialData.privateNote || '');
      setAttachments(initialData.attachments || []);
      setLogDate(initialData.date || getLocalToday());
      setBufferStatus(null);
    } else {
      setFormData({});
      setPrivateNote('');
      setAttachments([]);
      setLogDate(getLocalToday());
      setBufferStatus(null);
    }
  }, [initialData, activeStudentId, logId]);

  // 🌟 2. 背景自動備份：停止輸入 1.5 秒後，寫入專屬 Key 的緩衝區
  useEffect(() => {
    if (!activeStudentId) return;

    const timeoutId = setTimeout(() => {
      if (Object.keys(formData).length > 0 || privateNote.trim() !== '') {
        const bufferKey = `caselog_buffer_${activeStudentId}_${logId}`;
        localStorage.setItem(bufferKey, JSON.stringify({ formData, privateNote, logDate }));
        setBufferStatus(`暫存草稿 (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
      }
    }, 1500); 

    return () => clearTimeout(timeoutId);
  }, [formData, privateNote, logDate, activeStudentId, logId]);

  // 🌟 3. 清除緩衝區：讓老師可以捨棄剛才亂打的字，退回原本狀態
  const clearBuffer = () => {
    localStorage.removeItem(`caselog_buffer_${activeStudentId}_${logId}`);
    if (initialData) {
      setFormData(initialData.content || {});
      setPrivateNote(initialData.privateNote || '');
      setLogDate(initialData.date || new Date().toISOString().split('T')[0]);
    } else {
      setFormData({});
      setPrivateNote('');
      setLogDate(new Date().toISOString().split('T')[0]);
    }
    setBufferStatus('已捨棄未儲存內容');
    setTimeout(() => setBufferStatus(null), 2000);
  };

  const handleSaveDraft = async () => {
    await onSaveDraft({ content: formData, privateNote, attachments, date: logDate });
    // 🌟 順利存成「實體草稿」後，清掉防呆緩衝區
    localStorage.removeItem(`caselog_buffer_${activeStudentId}_${logId}`);
    
    if (!initialData) {
      setFormData({});
      setPrivateNote('');
      setAttachments([]);
      setLogDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit({ content: formData, privateNote, attachments, date: logDate });
      // 🌟 順利發布後，清掉防呆緩衝區
      localStorage.removeItem(`caselog_buffer_${activeStudentId}_${logId}`);
      
      if (!initialData) {
        setFormData({});
        setPrivateNote('');
        setAttachments([]);
        setLogDate(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('日誌發布失敗，保留表單內容', error);
    }
  };
  
  // 3. 手動清除草稿
  const clearDraft = () => {
    if (!activeStudentId) return;
    localStorage.removeItem(`caselog_draft_${activeStudentId}`);
    setFormData({});
    setPrivateNote('');
    setLogDate(new Date().toISOString().split('T')[0]);
    setDraftStatus('草稿已清除');
    setTimeout(() => setDraftStatus(null), 2000);
  };

  // 更新單一欄位值 (Text, Select, Rating)
  const handleValueChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // 更新多選欄位值 (Checkbox)
  const handleCheckboxChange = (id, option, isChecked) => {
    setFormData((prev) => {
      const currentOptions = prev[id] || [];
      if (isChecked) {
        return { ...prev, [id]: [...currentOptions, option] };
      } else {
        return { ...prev, [id]: currentOptions.filter((o) => o !== option) };
      }
    });
  };

  // 處理圖片上傳 (前端模擬預覽，實務需透過 Drive API 上傳)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // 將新選擇的檔案加入陣列中
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 渲染動態積木
  const renderBlock = (block) => {
    switch (block.type) {
      case 'rating':
        const currentValue = formData[block.id] || 0;
        return (
          <div className="flex gap-2 mt-2">
            {Array.from({ length: block.max || 5 }).map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => handleValueChange(block.id, starValue)}
                  className={`p-1 transition-colors ${
                    starValue <= currentValue ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <Star size={28} fill={starValue <= currentValue ? 'currentColor' : 'none'} />
                </button>
              );
            })}
          </div>
        );

      case 'checkbox':
        const selectedOptions = formData[block.id] || [];
        return (
          <div className="flex flex-col gap-2 mt-2">
            {block.options?.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => handleCheckboxChange(block.id, option, e.target.checked)}
                />
                <span className={`text-sm font-bold ${UI_THEME.TEXT_PRIMARY} group-hover:text-blue-500 transition-colors`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'select':
        return (
          <select
            className={`w-full mt-2 p-3 text-sm font-bold ${UI_THEME.INPUT_BASE}`}
            value={formData[block.id] || ''}
            onChange={(e) => handleValueChange(block.id, e.target.value)}
          >
            <option value="" disabled>請選擇...</option>
            {block.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'text':
        return (
          <textarea
            className={`w-full mt-2 p-3 min-h-[100px] text-sm font-bold resize-y ${UI_THEME.INPUT_BASE}`}
            value={formData[block.id] || ''}
            onChange={(e) => handleValueChange(block.id, e.target.value)}
            placeholder="請輸入詳細描述..."
          />
        );

      case 'image':
        return (
        <div className="flex flex-col gap-4">
          {/* 上傳按鈕區 */}
          <div className="relative">
            <input 
              type="file" 
              multiple 
              accept="image/jpeg, image/png, image/webp" 
              onChange={handleImageSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isSubmitting}
            />
            <div className={`w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${UI_THEME.BORDER_DEFAULT} hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/50`}>
              <Upload size={24} className={UI_THEME.TEXT_MUTED} />
              <span className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>點擊或拖曳上傳照片</span>
              <span className={`text-xs ${UI_THEME.TEXT_MUTED}`}>支援 JPG, PNG, WEBP</span>
            </div>
          </div>

          {/* 🌟 縮圖預覽與移除網格 */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {attachments.map((file, idx) => {
                const isLocalFile = file instanceof File;
                // 🌟 修正：利用 driveId 組合出可用於 <img> 的直連網址
                const src = isLocalFile ? URL.createObjectURL(file) : `https://drive.google.com/thumbnail?id=${file.driveId}&sz=w800`;
                const fileName = isLocalFile ? file.name : file.name;

                return (
                  <div key={idx} className="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={src} 
                      alt={fileName} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        disabled={isSubmitting}
                        className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-transform hover:scale-110 shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

      default:
        return <div className="text-red-500 text-sm font-bold">未知的欄位類型: {block.type}</div>;
    }
  };

  if (!template || template.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_CARD}`}>
        <FileText size={48} className={`mb-4 ${UI_THEME.TEXT_MUTED}`} />
        <p className={`font-bold ${UI_THEME.TEXT_SECONDARY}`}>目前沒有日誌模板，請先至編輯器設定欄位。</p>
      </div>
    );
  }

  return (
    
    <form onSubmit={handleSubmit} className={`flex flex-col gap-6 w-full max-w-5xl mx-auto p-6 md:p-8 rounded-2xl shadow-sm ${UI_THEME.SURFACE_MAIN} border ${UI_THEME.BORDER_DEFAULT}`}>
	{/* 🌟 新增：如果是編輯模式，在最上面顯示提示標題 */}
      {initialData && (
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Edit3 className="text-blue-500" size={20} />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            正在編輯 {initialData.date} 的日誌
          </h3>
        </div>
      )}
	  
	  {/* 🌟 新增：日期選擇器 */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800/50">
	  <div className="flex items-center gap-4">
        <label className={`text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_SECONDARY}`}>
          <Calendar size={18} />
          記錄日期：
        </label>
        <input 
          type="date" 
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          className={`p-2 rounded-lg text-sm font-bold w-full md:w-auto ${UI_THEME.INPUT_BASE}`}
          required
        />
      </div>
	  
	  {/* 顯示防呆緩衝區狀態 */}
        {bufferStatus && (
          <div className="flex items-center gap-3 text-sm animate-in fade-in duration-300">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
              <Save size={16} className="opacity-70" /> {bufferStatus}
            </span>
            <button
              type="button"
              onClick={clearBuffer}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 px-2 py-1 rounded-md transition-colors flex items-center gap-1 font-bold"
              title="清除暫存檔"
            >
              <Trash size={14} /> 清除暫存
            </button>
          </div>
        )}
      </div>
	  
	  
	  
      
      {/* 🌟 響應式動態表單渲染區 (Grid Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {template.map((block) => {
          // 判斷是否為需要佔滿整行的長版積木
          const isFullWidth = block.type === 'text' || block.type === 'image';
          
          return (
            <div 
              key={block.id} 
              className={`flex flex-col ${isFullWidth ? 'md:col-span-2' : ''}`}
            >
              <label className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY} mb-2`}>
                {block.label}
                {block.type === 'text' && <span className="ml-2 text-xs opacity-60">(家長可見)</span>}
              </label>
              {renderBlock(block)}
            </div>
          );
        })}
      </div>

      {/* 附件預覽區 */}
      {attachments.length > 0 && (
        <div className={`p-4 rounded-xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_CARD}`}>
          <h4 className={`text-xs font-bold mb-3 ${UI_THEME.TEXT_SECONDARY}`}>已選擇的附件 ({attachments.length})</h4>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${UI_THEME.BORDER_DEFAULT} bg-slate-50 dark:bg-slate-800`}>
                <span className={`text-xs font-bold truncate max-w-[120px] ${UI_THEME.TEXT_PRIMARY}`}>
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className={`border-t ${UI_THEME.BORDER_DEFAULT} my-2`} />

      {/* 隱私備註區 (僅老師可見) - 讓它也維持在舒適的寬度或滿版 */}
      <div className={`p-5 md:p-6 rounded-xl border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600`}>
        <div className="flex items-center gap-2 mb-3">
          <Lock size={16} className="text-amber-600 dark:text-amber-500" />
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">內部備註 (家長不可見)</h3>
        </div>
        <textarea
          className={`w-full p-4 text-sm font-bold min-h-[100px] bg-white/50 dark:bg-slate-900/50 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 transition-all border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 resize-y`}
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value)}
          placeholder="記錄老師間的交接事項、特殊觀察..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {/* 🌟 新增：編輯模式專用的「取消編輯」按鈕 */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={`px-6 py-3.5 rounded-xl font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300`}
          >
            取消編輯
          </button>
        )}
		
		{/* 🌟 新增：草稿按鈕 (僅在新增模式或編輯草稿時顯示) */}
		{initialData?.isDraft && onDeleteDraft && (
          <button
            type="button"
            onClick={onDeleteDraft}
            disabled={isSubmitting}
            className={`px-6 py-3.5 rounded-xl font-bold transition-all text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-400`}
          >
            捨棄草稿
          </button>
        )}
		
        {(!initialData || initialData.isDraft) && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className={`px-6 py-3.5 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200`}
          >
            儲存為草稿
          </button>
        )}
        
        {/* 送出按鈕 (根據是否為編輯模式切換文字) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold shadow-sm transition-all ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:shadow-md'
          } ${UI_THEME.BTN_PRIMARY}`}
        >
          {isSubmitting ? (
            <span className="animate-pulse">儲存中...</span>
          ) : (
            <span>{(initialData && !initialData.isDraft ? '儲存修改' : '正式發布')}</span>
          )}
        </button>
      </div>
	  
    </form>
  );
}