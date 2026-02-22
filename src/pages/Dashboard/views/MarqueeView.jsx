import React, { useEffect, useMemo } from 'react';
import { X, Megaphone } from 'lucide-react';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer'; 
import { useTTS } from '../../../hooks/useTTS'; 

const MarqueeView = ({ message, sub, onClose, color, isGlobalZhuyin, showZhuyin }) => {
  const shouldShowZhuyin = showZhuyin || isGlobalZhuyin;
  const fullText = sub ? `${message}：${sub}` : message;
  
  const { speak, cancel } = useTTS();

  // 🌟 新增：動態計算適合的滾動秒數
  // 基礎秒數(橫越螢幕的時間) + 每個字額外給予的閱讀時間
  const scrollDuration = useMemo(() => {
    const textLength = fullText ? fullText.length : 0;
    // 假設螢幕基礎跨越需 15 秒，每個中文字再多給 0.4 秒
    const calculatedSeconds = 15 + (textLength * 0.4);
    // 設定最低下限為 20 秒，避免極短字串跑太快
    return Math.max(20, calculatedSeconds);
  }, [fullText]);

  // 進場時發音一次
  useEffect(() => {
    if (fullText) {
      speak(fullText, 'general', 0.9);
    }
    return () => cancel();
  }, [fullText, speak, cancel]);

  const MarqueeItem = () => (
    // 🌟 修正：加入 py-2 (垂直 padding)，確保上方注音符號不會因為 overflow-hidden 被削掉頭
    <div className="flex items-center py-2">
       <ZhuyinRenderer 
          text={fullText} 
          isActive={shouldShowZhuyin} 
       />
    </div>
  );

  return (
    <div className={`absolute top-0 left-0 right-0 z-[60] h-16 sm:h-20 shadow-xl flex items-center bg-gradient-to-r ${color || 'from-blue-600 to-indigo-700'} text-white overflow-hidden`}>
      
      <div className="flex items-center gap-3 px-4 sm:px-6 h-full bg-black/20 z-20 shrink-0 backdrop-blur-sm border-r border-white/10 relative">
        <Megaphone className="animate-pulse" size={28} />
        <span className="font-bold text-lg tracking-widest uppercase hidden md:block">教室廣播</span>
      </div>

      <div className="flex-1 min-w-0 relative h-full flex items-center group">
        
        {/* 動畫區塊 */}
        <div 
          className="flex w-max absolute left-0 font-bold text-3xl sm:text-4xl text-white group-hover:[animation-play-state:paused] tracking-wide"
          // 🌟 將動態計算出的秒數，直接透過 inline-style 注入
          style={{ animation: `marquee ${scrollDuration}s linear infinite` }}
        >
            <MarqueeItem />
        </div>
        
      </div>

      <div className="z-20 px-3 h-full flex items-center bg-black/20 backdrop-blur-sm border-l border-white/10 shrink-0 relative">
        <button 
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-full transition-colors"
            title="關閉廣播"
        >
            <X size={28} />
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        /* 移除原本寫死的 .animate-marquee，改用上方 style 動態注入 */
      `}</style>
    </div>
  );
};

export default MarqueeView;