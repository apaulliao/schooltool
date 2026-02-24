import React, { useState, useEffect } from 'react';
import { X, Sparkles, Rocket, Bug, Calendar, History } from 'lucide-react'; // 引入 History icon
import { APP_VERSION, PATCH_NOTES } from '../../utils/patchNotesData';

const PatchNotesModal = ({ isOpen, onClose, mode = 'latest' }) => {
  // mode: 'latest' (只顯示最新, 自動彈出用) | 'history' (顯示全部, 手動點開用)

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'new': return <Sparkles size={16} className="text-amber-500 mt-1" />;
      case 'improve': return <Rocket size={16} className="text-emerald-500 mt-1" />;
      case 'fix': return <Bug size={16} className="text-rose-500 mt-1" />;
      default: return <Sparkles size={16} />;
    }
  };

  // 決定要顯示的資料：全部 vs 只有第一筆
  const displayNotes = mode === 'history' ? PATCH_NOTES : [PATCH_NOTES[0]];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-b dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {mode === 'history' ? <History className="text-indigo-500" /> : <Sparkles className="text-amber-500" />}
              {mode === 'history' ? '系統更新歷史' : `發現新版本 v${APP_VERSION}`}
            </h2>
            {mode === 'latest' && <p className="text-sm text-slate-500 mt-1">看看我們為您準備了哪些新功能！</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-10">
            {displayNotes.map((note, index) => (
              <div key={note.version} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 last:border-l-0">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${index === 0 ? 'bg-indigo-500' : 'bg-slate-400'}`}></div>
                
                {/* Version & Date */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">v{note.version}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12}/> {note.date}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">{note.title}</h3>

                {/* Changes List */}
                <ul className="space-y-2">
                  {note.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <div className="shrink-0">{getIcon(change.type)}</div>
                      <span>{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 text-right">
           <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all">
             {mode === 'latest' ? '開始體驗' : '關閉'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default PatchNotesModal;