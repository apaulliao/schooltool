import React, { useState, useEffect } from 'react';
import { Star, Upload, Send, Lock, X, FileText, Edit3 } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

export default function LogForm({ 
  template = [], 
  onSubmit, 
  isSubmitting = false, 
  initialData = null, // 🌟 新增 prop
  onCancel = null     // 🌟 新增 prop
}) {
  // 🌟 1. 保持您原本的變數名稱，並讓初始值優先讀取 initialData
  const [formData, setFormData] = useState(initialData?.content || {});
  const [privateNote, setPrivateNote] = useState(initialData?.privateNote || '');
  const [attachments, setAttachments] = useState(initialData?.attachments || []);

  // 🌟 2. 新增這個 useEffect：當點擊不同篇舊日誌、或切換回新增模式時，能即時更新表單內容
  useEffect(() => {
    if (initialData) {
      setFormData(initialData.content || {});
      setPrivateNote(initialData.privateNote || '');
      setAttachments(initialData.attachments || []);
    } else {
      // 如果切換回「新增模式」，就把表單清空
      setFormData({});
      setPrivateNote('');
      setAttachments([]);
    }
  }, [initialData]);

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
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    // 清空 input 值允許重複選擇相同檔案
    e.target.value = '';
  };

  const removeAttachment = (indexToRemove) => {
    setAttachments((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. 等待上層 (TeacherDashboard) 呼叫 API 儲存資料
      // 注意：這裡必須加上 await，確保真的存檔成功了才往下走
      await onSubmit({ content: formData, privateNote, attachments });

      // 2. 判斷如果是「新增模式」(沒有傳入 initialData)
      // 就在存檔成功後，把表單狀態歸零，還原成乾淨的新日誌狀態
      if (!initialData) {
        setFormData({});
        setPrivateNote('');
        setAttachments([]);
      }
      
    } catch (error) {
      // 如果存檔失敗，保留表單內容讓老師可以重試
      console.error('日誌發布失敗，保留表單內容', error);
    }
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
          <div className="mt-2">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer ${UI_THEME.BORDER_DEFAULT} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-8 h-8 mb-3 ${UI_THEME.TEXT_MUTED}`} />
                <p className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>點擊上傳照片</p>
              </div>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            </label>
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
            <span>{initialData ? '儲存修改' : '發布日誌'}</span>
          )}
        </button>
      </div>
	  
    </form>
  );
}