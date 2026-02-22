import React, { useState, useRef, useEffect } from 'react';
import { X, Check, FileText, Upload, BookOpen } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { parseExamText, parseExamHtml } from '../utils/examParser';
import mammoth from 'mammoth';

// 🌟 新增：支援的科目清單與對應的內部代碼
const SUBJECT_OPTIONS = [
  { id: 'general', label: '通用 (國語/社會/綜合)' },
  { id: 'math', label: '數學科' },
  { id: 'english', label: '英文科' },
  { id: 'science', label: '自然科' }
];

// 🌟 新增：自動判讀科目的輔助函式
const detectSubject = (text, filename = '') => {
  const content = (text + ' ' + filename).substring(0, 500); // 只掃描前 500 字，提高效能
  if (/數學|算數|加減乘除|幾何/.test(content)) return 'math';
  if (/自然|理化|生物|科學/.test(content)) return 'science';
  if (/英文|英語|English|[a-zA-Z]{10,}/.test(content)) return 'english';
  return 'general'; // 預設為通用
};

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [importText, setImportText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('general'); // 🌟 新增科目狀態
  const fileInputRef = useRef(null);

    // 🌟 監聽純文字貼上，嘗試自動判讀 (可加上防抖 debounce 避免頻繁觸發)
  useEffect(() => {
    if (importText.length > 10) {
      setSelectedSubject(detectSubject(importText));
    }
  }, [importText]);
  
  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!importText.trim()) return;
    const parsedData = parseExamText(importText);
    if (parsedData.length > 0) {
      // 🌟 將選定的科目代碼一併傳出
      onImportSuccess(parsedData, '手動匯入考卷', selectedSubject);
      setImportText('');
      setSelectedSubject('general'); // 重置
      onClose();
    }
  };

  // 觸發隱藏的檔案選擇器
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    // 透過檔名進行初步判讀
    setSelectedSubject(detectSubject('', file.name)); 

    try {
      if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            
            const parsedData = parseExamHtml(result.value);
            if (parsedData.length > 0) {
              const examTitle = file.name.replace('.docx', '');
              // 若檔名沒有明顯特徵，從轉出的 HTML 內容再次判讀
              const finalSubject = detectSubject(result.value, examTitle);
              
              // 🌟 將選定的科目代碼一併傳出
              onImportSuccess(parsedData, examTitle, finalSubject); 
              setImportText('');
              onClose(); 
            }
          } catch (error) {
            console.error('Word 檔案解析失敗:', error);
            alert('Word 檔案解析失敗，請確認檔案未損壞。');
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(file);

      } else if (file.name.endsWith('.txt')) {
        // 解析純文字檔 (.txt)
        const reader = new FileReader();
        reader.onload = (event) => {
          setImportText(prev => prev + (prev ? '\n\n' : '') + event.target.result);
          setIsProcessing(false);
        };
        reader.readAsText(file);

      } else {
        alert('系統目前僅支援 .docx 或 .txt 格式的檔案。');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('檔案讀取發生錯誤:', error);
      alert('檔案讀取發生錯誤。');
      setIsProcessing(false);
    } finally {
      // 清空 input value，確保同一個檔案可重複選取
      e.target.value = ''; 
    }
  };

  return (
    <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`${UI_THEME.SURFACE_MAIN} w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border ${UI_THEME.BORDER_DEFAULT}`}>
        
        {/* 標題與工具列 */}
        <div className={`px-6 py-4 border-b ${UI_THEME.BORDER_DEFAULT} flex justify-between items-center bg-slate-50 dark:bg-slate-800/50`}>
          <div className="flex items-center gap-4">
            <h3 className={`font-bold text-xl ${UI_THEME.TEXT_PRIMARY} flex items-center gap-2`}>
              <FileText size={24} className="text-blue-500" /> 匯入試卷文字
            </h3>
            
            {/* 上傳檔案按鈕 */}
            <button 
              onClick={triggerFileInput}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${isProcessing ? 'bg-slate-200 text-slate-500 cursor-wait' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/60'}`}
            >
              <Upload size={16} />
              {isProcessing ? '檔案解析中...' : '上傳 Word / TXT'}
            </button>
            
            {/* 隱藏的檔案輸入框 */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".docx,.txt" 
              className="hidden" 
            />
          </div>

          <button onClick={onClose} className={`p-2 rounded-lg ${UI_THEME.BTN_GHOST}`}>
            <X size={20} />
          </button>
        </div>

        {/* 文字編輯區塊 */}
        <div className="p-6 flex-1 flex flex-col gap-2">
          <div className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>
            請確認下方文字格式正確，可直接手動修改微調後再進行解析。
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="請將考卷文字貼在此處，或點擊上方「上傳 Word / TXT」按鈕匯入檔案..."
            className={`w-full h-[50vh] p-4 rounded-xl resize-none ${UI_THEME.INPUT_BASE} ${UI_THEME.TEXT_PRIMARY} font-mono text-lg`}
          />
        </div>

        {/* 底部按鈕 */}
        <div className={`px-6 py-4 border-t ${UI_THEME.BORDER_DEFAULT} flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50`}>
		{/* 🌟 讓老師選擇或確認科目的下拉選單 */}
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">報讀科目：</span>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button onClick={onClose} className={`px-6 py-2 rounded-xl font-bold ${UI_THEME.BTN_SECONDARY}`}>
            取消
          </button>
          <button onClick={handleSubmit} className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 ${UI_THEME.BTN_PRIMARY}`}>
            <Check size={18} /> 開始解析
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportModal;