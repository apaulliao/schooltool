import React, { useEffect } from 'react';
import { X, Volume2 } from 'lucide-react';
import StarryBackground from '../components/StarryBackground';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer'; 
import { useTTS } from '../../../hooks/useTTS'; // 🌟 引入語音模組

const SpecialView = ({ specialStatus, onClose, now, is24Hour, subjectHints, isSystemSoundEnabled, isGlobalZhuyin}) => {
  const { speak, cancel } = useTTS(); // 🌟 取出語音控制函式

  // 🌟 核心邏輯：當這個特殊狀態視窗彈出時，自動播報一次
  useEffect(() => {
    // 只有在有狀態，且系統未靜音時才發聲
    if (specialStatus && isSystemSoundEnabled) {
      // 如果有副標題 (sub)，就把它和主標題串在一起唸
      const textToSpeak = specialStatus.sub 
        ? `${specialStatus.message}。${specialStatus.sub}` 
        : specialStatus.message;
      
      speak(textToSpeak, 'general', 0.9);
    }
    
    // 當視窗關閉時，立刻中斷語音
    return () => cancel();
  }, [specialStatus, isSystemSoundEnabled, speak, cancel]);

  if (!specialStatus) return null;
  const Icon = specialStatus.icon;
  const shouldShowZhuyin = specialStatus.showZhuyin || isGlobalZhuyin;
  const isStarryMode = ['nap', 'morning_reading', 'quiet'].includes(specialStatus.id);

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-500 cursor-pointer" 
        onClick={onClose}
    >
        {/* 背景層判斷 */}
        {isStarryMode ? (
            <div className="absolute inset-0 bg-slate-950">
                <StarryBackground />
            </div>
        ) : (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md">
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-gradient-to-r ${specialStatus.color || 'from-blue-600 to-indigo-600'} rounded-full blur-[100px] opacity-20 pointer-events-none`}></div>
            </div>
        )}

        <div 
            className={`relative max-w-5xl w-full mx-4 rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 ${isStarryMode ? 'bg-black/20 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-xl'} cursor-auto`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`h-4 w-full bg-gradient-to-r ${specialStatus.color || 'from-blue-500 to-indigo-500'}`}></div>
            
            <div className="flex flex-col items-center justify-center text-center p-16 md:p-24 relative">
                {/* 關閉按鈕 */}
                <button 
                    onClick={onClose} 
                    className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 z-20"
                >
                    <X size={28} />
                </button>

                {/* 音效提示 (這裡會根據您的 isSystemSoundEnabled 屬性顯示) */}
                {isSystemSoundEnabled && (
                    <div className="absolute top-8 left-8 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-white/50 flex items-center gap-2 text-sm font-bold">
                        <Volume2 size={16} /> 狀態廣播中
                    </div>
                )}

                {/* 主圖示 */}
                {Icon && (
                    <div className={`mb-10 p-8 rounded-full bg-gradient-to-br ${specialStatus.color || 'from-blue-500 to-indigo-500'} shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-bounce-slow`}>
                        <Icon size={80} className="text-white drop-shadow-md" />
                    </div>
                )}

                <h1 className="text-[6rem] font-black mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 drop-shadow-sm tracking-tight">
                    <ZhuyinRenderer 
                        text={specialStatus.message} 
                        isActive={shouldShowZhuyin}
					/>
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-indigo-100/90 leading-relaxed max-w-3xl">
                    <ZhuyinRenderer 
                        text={specialStatus.sub} 
                        isActive={shouldShowZhuyin}
					/>
                </h2>
                
                {!specialStatus.sub && subjectHints && (
                     <div className="mt-8 text-xl text-slate-400 font-medium border border-white/10 px-6 py-2 rounded-full">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                     </div>
                )}
            </div>
        </div>
        
        {/* 底部提示文字 */}
        <div className="absolute bottom-8 text-white/20 text-sm font-bold tracking-widest uppercase hover:text-white/40 transition-colors z-20">
            Click background to close
        </div>
    </div>
  );
};

export default SpecialView;