import React, { useState, useEffect } from 'react';
import { Calendar, User, Star, CheckCircle2, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// 🌟 引入真實的 API 與解碼工具
import { fetchPublicCaseLog } from '../../../utils/googleDriveService';
import { decodeRowData } from '../utils/sheetSchema';

// 🌟 沿用您在 useExamCloud 中使用的 API Key
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  // 建議加入錯誤檢查，避免部署時因遺漏變數而導致系統異常
	if (!apiKey) {
	  console.error("尚未設定 VITE_GOOGLE_API_KEY 環境變數");
	}

export default function ParentView() {
  const [logs, setLogs] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sheetId = searchParams.get('id');
	const tmsParam = searchParams.get('tms');
    const targetTimestamps = tmsParam ? tmsParam.split(',').map(decodeURIComponent) : null;

    if (!sheetId) {
      setError('無效的連結。請確認您使用的是老師提供的完整網址。');
      setIsLoading(false);
      return;
    }

    const targetLogIds = searchParams.get('logs')?.split(',') || null;

    const fetchPublicData = async () => {
      try {
        setIsLoading(true);
        const { studentName, values } = await fetchPublicCaseLog(sheetId, apiKey);
        
        let parsedLogs = values.map((row, index) => {
          const uniqueId = `public_log_${index}_${row[0]}`;
          return decodeRowData(row, uniqueId);
        }).reverse();

        // 🌟 2. 攔截器：如果網址有指定 ID，就只留下那些日誌
        if (targetTimestamps && targetTimestamps.length > 0) {
          parsedLogs = parsedLogs.filter(log => targetTimestamps.includes(log.timestamp));
        }

        setStudentName(studentName);
        setLogs(parsedLogs);
      } catch (err) {
        setError('無法載入日誌資料，可能是老師尚未開放權限，或網址有誤。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, []);
  
  // 唯讀積木渲染器
  const renderReadOnlyBlock = (block, value) => {
    if (value === undefined || value === null || value === '') return null;

    switch (block.type) {
      case 'rating':
        return (
          <div className="flex gap-1">
            {Array.from({ length: block.max || 5 }).map((_, i) => (
              <Star 
                key={i} 
                size={18} 
                className={i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'} 
              />
            ))}
          </div>
        );

      case 'checkbox':
        if (!Array.isArray(value) || value.length === 0) return <span className={`text-sm ${UI_THEME.TEXT_MUTED}`}>無紀錄</span>;
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((item, idx) => (
              <span key={idx} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800`}>
                <CheckCircle2 size={12} />
                {item}
              </span>
            ))}
          </div>
        );

      case 'select':
        return (
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 w-fit border border-emerald-200 dark:border-emerald-800`}>
            <Tag size={14} />
            {value}
          </span>
        );

      case 'text':
        return (
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${UI_THEME.TEXT_PRIMARY} font-medium`}>
            {value}
          </p>
        );

      default:
        return null;
    }
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${UI_THEME.BACKGROUND}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className={`font-bold ${UI_THEME.TEXT_SECONDARY}`}>載入日誌中...</p>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${UI_THEME.BACKGROUND}`}>
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className={`text-lg font-bold mb-2 ${UI_THEME.TEXT_PRIMARY}`}>存取失敗</h2>
        <p className={`text-sm ${UI_THEME.TEXT_SECONDARY}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-12 ${UI_THEME.BACKGROUND}`}>
      {/* 頂部導覽列 (滿版置中) */}
      <div className={`sticky top-0 z-10 px-6 py-5 flex flex-col items-center justify-center shadow-sm ${UI_THEME.SURFACE_GLASS} border-b ${UI_THEME.BORDER_DEFAULT}`}>
        <h1 className={`text-xl font-bold tracking-wider ${UI_THEME.TEXT_PRIMARY}`}>
          {studentName} 的個案日誌
        </h1>
        <p className={`text-sm mt-1 ${UI_THEME.TEXT_MUTED}`}>
          ClassroomOS 智慧教室系統
        </p>
      </div>

      {/* 🌟 響應式卡片牆：手機 1 欄 -> 平板 2 欄 -> 寬螢幕 3 欄 */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
        {logs.length === 0 ? (
          <div className={`text-center py-20 ${UI_THEME.TEXT_MUTED} font-bold text-lg`}>
            目前沒有任何日誌紀錄。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`rounded-2xl overflow-hidden shadow-sm border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} hover:shadow-md transition-shadow`}
              >
                {/* 卡片標頭 */}
                <div className={`px-5 py-4 border-b ${UI_THEME.BORDER_LIGHT} bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center`}>
                  <div className="flex items-center gap-2.5">
                    <Calendar size={18} className={UI_THEME.TEXT_SECONDARY} />
                    <span className={`text-sm font-bold ${UI_THEME.TEXT_PRIMARY}`}>{log.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={14} className={UI_THEME.TEXT_MUTED} />
                    <span className={`text-xs font-bold ${UI_THEME.TEXT_SECONDARY}`}>{log.author.replace(' (已編輯)', '')}</span>
                  </div>
                </div>

                {/* 卡片內容：內部同樣採用微型網格 */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                  {log.template.map((block) => {
                    const blockValue = log.content[block.id];
                    if (blockValue === undefined || blockValue === '') return null;

                    const isFullWidth = block.type === 'text' || block.type === 'image';

                    return (
                      <div key={block.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
                        <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED}`}>
                          {block.label}
                        </span>
                        {renderReadOnlyBlock(block, blockValue)}
                      </div>
                    );
                  })}
                </div>
				{/* 🌟 新增：圖片附件渲染區塊 (家長端專用) */}
                {log.attachments && log.attachments.length > 0 && (
                  <div className={`px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/50`}>
                    <span className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} block mb-3`}>
                      照片紀錄
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {log.attachments.map((file, idx) => {
                        // 檢查是否有 driveId，避免舊版資料引發破圖
                        const hasDriveId = Boolean(file.driveId);
                        if (!hasDriveId) return null;

                        return (
                          <div key={idx} className={`relative aspect-square rounded-lg border ${UI_THEME.BORDER_DEFAULT} overflow-hidden bg-slate-100 dark:bg-slate-800`}>
                            <a href={file.url} target="_blank" rel="noreferrer" title="點擊開啟原圖">
                              <img
                                src={`https://drive.google.com/thumbnail?id=${file.driveId}&sz=w800`}
                                alt={file.name || '照片紀錄'}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}