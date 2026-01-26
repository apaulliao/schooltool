import React from 'react';
import { 
  X, Type, Download, CheckCircle2, Info, BookOpen 
} from 'lucide-react';
import { UI_THEME } from '../../utils/constants';
import { useOS } from '../../context/OSContext';

const ZhuyinSettingsModal = ({ 
  isOpen, 
  onClose
}) => {
const { isGlobalZhuyin, setIsGlobalZhuyin, fontInstalled } = useOS();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`${UI_THEME.SURFACE_GLASS} w-full max-w-md rounded-2xl shadow-2xl border ${UI_THEME.BORDER_DEFAULT} overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Type size={20} />
            </div>
            <h3 className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>注音顯示設定</h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_SECONDARY}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* 1. 功能開關區塊 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className={`font-bold ${UI_THEME.TEXT_PRIMARY}`}>低年級注音模式</div>
              <div className={`text-xs ${UI_THEME.TEXT_MUTED}`}>
                開啟後，提示部分將顯示國字注音 (適合低年級教學)
              </div>
            </div>
            <button
              onClick={() => setIsGlobalZhuyin(!isGlobalZhuyin)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                isGlobalZhuyin ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                isGlobalZhuyin ? 'translate-x-6' : 'translate-x-0'
              }`}>
                {isGlobalZhuyin && <Type size={14} className="text-indigo-600" />}
              </div>
            </button>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* 2. 字型狀態與下載區塊 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className={UI_THEME.TEXT_SECONDARY} />
              <span className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>字型資源狀態</span>
            </div>

            <div className={`p-4 rounded-xl border ${fontInstalled ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'}`}>
              <div className="flex items-start gap-3">
                {fontInstalled ? (
                  <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <Info size={20} className="text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className={`font-bold text-sm mb-1 ${fontInstalled ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {fontInstalled ? '本機字型已就緒' : '未偵測到本機字型'}
                  </div>
                  <div className={`text-xs leading-relaxed ${fontInstalled ? 'text-emerald-600/80 dark:text-emerald-500/80' : 'text-amber-600/80 dark:text-amber-500/80'}`}>
                    {fontInstalled 
                      ? '系統已偵測到「源泉注音圓體」，將提供最佳閱讀體驗與載入效能。' 
                      : '目前使用網頁暫存字型。建議下載並安裝至電腦，以獲得更清晰的顯示效果與秒開速度。'
                    }
                  </div>
                </div>
              </div>

              {!fontInstalled && (
                <button 
                  onClick={() => window.open('/fonts/BpmfGenSenRounded-R.ttf', '_blank')}
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Download size={16} />
                  下載「源泉注音圓體」(.ttf)
                </button>
              )}
            </div>
          </div>

        </div>
        
        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-center">
           <p className="text-[10px] text-slate-400">
             本系統採用開源專案「源泉注音圓體」，感謝 But Ko 開發貢獻。
           </p>
        </div>
      </div>
    </div>
  );
};

export default ZhuyinSettingsModal;