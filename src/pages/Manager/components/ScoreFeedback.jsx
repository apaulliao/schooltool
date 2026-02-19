import React from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Crown, Users, Sparkles } from 'lucide-react';

const ScoreFeedback = ({ feedbacks, mode = "celebrate" }) => {
  if (!feedbacks || feedbacks.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex items-center justify-center">
      {feedbacks.map((fb) => {
        if (fb.type === 'milestone') {
            return <MilestoneEffect key={fb.id} feedback={fb} mode={mode} />;
        }
        if (fb.type === 'class' || fb.type === 'group') {
            return <GrandEffect key={fb.id} feedback={fb} mode={mode} />;
        }
        return <FloatingBubble key={fb.id} feedback={fb} mode={mode} />;
      })}
    </div>,
    document.body
  );
};




// --- 豪華大特效 (Grand Effect) ---
const GrandEffect = ({ feedback, mode = "celebrate" }) => {
  const isCalm = mode === "calm";
  const isClass = feedback.type === "class";
  const isGroup = feedback.type === "group";
  const isPositive = feedback.value > 0;

  // 位置策略：全班置中，小組置中偏下（留上方給小組里程碑）
  const posClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  const posGroupScore = "top-0 left-1/2 -translate-x-1/2 translate-y-[100%]";
  const position = isClass ? posClass : posGroupScore;

  // confetti（只給全班正向 + 非 calm）
  const confettiCount = 30;
  const confettiParticles = React.useMemo(() => {
  const colors = ["#FFC107", "#FF5722", "#03A9F4", "#4CAF50", "#E91E63"];
  return Array.from({ length: confettiCount }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;        // 0~360°
    const dist = 120 + Math.random() * 220;           // 飛行距離
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (60 + Math.random() * 120); // 稍微往上
    const rot = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
    const delay = Math.random() * 0.25;               // 0~0.25s：更像爆開
    const size = 6 + Math.random() * 8;               // 6~14px
    const color = colors[i % colors.length];
    return { i, dx, dy, rot, delay, size, color };
  });
}, [confettiCount]);

  return (
    <div
      className={`absolute ${position} ${
        isGroup ? "animate-float-soft" : ""
      } flex flex-col items-center justify-center`}
    >
      {isClass && isPositive && !isCalm && (
		  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
			{confettiParticles.map((p) => (
			  <div
				key={p.i}
				className="confetti-piece"
				style={{
				  backgroundColor: p.color,
				  width: `${p.size}px`,
				  height: `${p.size}px`,
				  animationDelay: `${p.delay}s`,
				  ["--dx"]: `${p.dx}px`,
				  ["--dy"]: `${p.dy}px`,
				  ["--rot"]: `${p.rot}deg`,
				}}
			  />
			))}
		  </div>
		)}

      <div className="animate-pop-and-vanish relative flex flex-col items-center">
        {/* 淡淡一圈光暈：貼著卡片，不會很大很長 */}
        {!isCalm && (
          <>
            <div
              className={`
                pointer-events-none absolute -inset-2 rounded-[28px]
                opacity-30 blur-[6px]
                ${isClass ? "bg-yellow-400/75" : "bg-indigo-400/75"}
              `}
            />
            <div
              className={`
                pointer-events-none absolute -inset-[1px] rounded-[24px]
                ${isClass ? "ring-2 ring-yellow-300/20" : "ring-2 ring-indigo-300/20"}
              `}
            />
          </>
        )}

        {/* 卡片本體：小組比全班小一階 */}
        <div
          className={`
            relative ${isClass ? "px-12 py-6" : "px-8 py-4"} rounded-3xl border-4
            shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
            flex items-center gap-6 backdrop-blur-xl
            ${isClass
              ? "bg-gradient-to-br from-yellow-50/90 to-amber-100/90 border-yellow-400 text-amber-800"
              : "bg-gradient-to-br from-slate-50/90 to-indigo-100/90 border-indigo-400 text-indigo-800"
            }
          `}
        >
          <div
            className={`
              ${isClass ? "p-4" : "p-3"} rounded-full shadow-inner border-2
              ${isClass ? "bg-yellow-200 border-yellow-300" : "bg-indigo-200 border-indigo-300"}
            `}
          >
            <Users size={isClass ? 48 : 38} />
          </div>

          <div className="flex flex-col">
            <span
              className={`${
                isClass ? "text-2xl" : "text-lg"
              } font-bold opacity-80 uppercase tracking-widest`}
            >
              {feedback.label}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`${
                  isClass ? "text-6xl" : "text-5xl"
                } font-black ${isPositive ? "" : "text-slate-500"}`}
              >
                {isPositive ? "+" : ""}
                {feedback.value}
              </span>

              {isPositive && (
                <Sparkles
                  size={isClass ? 32 : 24}
                  className="animate-spin-slow text-yellow-500 filter drop-shadow"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- 一般個人加分氣泡 ---
const FloatingBubble = ({ feedback }) => {
  const isPositive = feedback.value > 0;
  const randomX = (Math.random() - 0.5) * 40; 
  return (
    <div
      className={`absolute flex flex-col items-center justify-center animate-float-up opacity-0 z-50`}
      style={{ left: feedback.x + randomX, top: feedback.y, animationDelay: `${feedback.delay || 0}ms` }}
    >
      <div className={`font-black rounded-full shadow-lg border-2 flex items-center justify-center backdrop-blur-sm ${isPositive ? 'text-2xl w-12 h-12 border-emerald-200 bg-emerald-100/90 text-emerald-600' : 'text-2xl w-12 h-12 border-rose-200 bg-rose-100/90 text-rose-600'}`}>
        {feedback.value > 0 ? '+' : ''}{feedback.value}
      </div>
    </div>
  );
};

// --- 里程碑特效 ---
const MilestoneEffect = ({ feedback, mode }) => {
    const isGroup = feedback.milestoneType === 'group';
    const color = isGroup ? '#818cf8' : '#fbbf24'; 
    const isCalm = mode === "calm";
    return (
        // ★ 修改：容器本身加入 fade-out-end 動畫，確保最後一同消失
        <div 
            className="absolute flex flex-col items-center pointer-events-none animate-fade-out-end z-[100]"
            style={{ left: feedback.x, top: feedback.y, transform: 'translate(-50%, -50%)' }}
        >
		{!isCalm && (
            <div className="absolute inset-0 flex items-center justify-center opacity-60 animate-spin-slow pointer-events-none mix-blend-screen">
                 <div className={`${isGroup ? 'w-[340px] h-[340px]' : 'w-[280px] h-[280px]'} rounded-full`} 
                      style={{ 
                          background: `conic-gradient(from 0deg, 
                            transparent 0deg, ${color} 15deg, transparent 30deg, 
                            transparent 45deg, ${color} 60deg, transparent 75deg,
                            transparent 90deg, ${color} 105deg, transparent 120deg,
                            transparent 135deg, ${color} 150deg, transparent 165deg,
                            transparent 180deg, ${color} 195deg, transparent 210deg,
                            transparent 225deg, ${color} 240deg, transparent 255deg,
                            transparent 270deg, ${color} 285deg, transparent 300deg,
                            transparent 315deg, ${color} 330deg, transparent 345deg
                          )`,
                          maskImage: 'radial-gradient(closest-side, black 40%, transparent 95%)',
                          WebkitMaskImage: 'radial-gradient(closest-side, black 40%, transparent 95%)'
                      }}
                 />
            </div>
		)}
            <div className="absolute inset-0 animate-pulse-slow opacity-50">
                <div className={`${isGroup ? 'w-44 h-44' : 'w-32 h-32'} rounded-full blur-[40px] ${isGroup ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
            </div>

            {/* 主體圖示 (★ 修改：Bounce In 之後會停留在畫面上，最後由外層 fade-out 帶走) */}
            <div className="relative animate-bounce-in flex flex-col items-center z-10">
                <div className={`
                    p-3 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.2)] mb-2 bg-white
                    ${isGroup ? 'border-indigo-300 text-indigo-600' : 'border-amber-300 text-amber-500'}
                `}>
                    {isGroup ? <Crown size={40} fill="currentColor" /> : <Trophy size={28} fill="currentColor" />}
                </div>
                
                <div className="flex flex-col items-center">
                    <span className={`${isGroup ? 'text-6xl' : 'text-5xl'} font-black text-white text-stroke-2 drop-shadow-2xl tracking-wider font-mono`}>
                        {feedback.value}
                    </span>
                    <span className="text-sm font-black text-white bg-slate-900/80 px-3 py-1 rounded-full mt-2 border border-white/30 tracking-widest shadow-lg">
                        LEVEL UP!
                    </span>
                </div>
            </div>
            
             <div className="absolute inset-0 w-full h-full overflow-visible">
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-particle-1"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-particle-2"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-particle-3"></div>
                 <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-particle-4"></div>
            </div>
        </div>
    );
};

export default ScoreFeedback;

// --- CSS Styles (重寫動畫 Keyframes) ---
const styles = `
@keyframes float-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.animate-float-soft {
  animation: float-soft 3s ease-in-out infinite;
}
  @keyframes float-up {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
    80% { transform: translateY(-60px) scale(1); opacity: 1; }
    100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
  }
  
  @keyframes bounce-in {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.5); opacity: 1; }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
  }

  /* ★ 新增：彈出並優雅消失 (總長 3s) */
	@keyframes pop-and-vanish {
	  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
	  20% { transform: scale(1.1) rotate(2deg); opacity: 1; }
	  30% { transform: scale(1) rotate(0deg); opacity: 1; }
	  70% { transform: scale(1.02); opacity: 1; } /* 微呼吸 */
	  85% { transform: scale(1); opacity: 1; }
	  100% { transform: scale(1.08) translate(0, -20px); opacity: 0; }
	}

  /* ★ 新增：純淡出 (給 Milestone 用) */
  @keyframes fade-out-end {
      0% { opacity: 1; }
      85% { opacity: 1; }
      100% { opacity: 0; }
  }

  @keyframes pulse-slow {
      0% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.5); opacity: 0.8; }
      100% { transform: scale(1); opacity: 0.5; }
  }
  
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  /* 粒子動畫 (1.5s 快速消失) */

	
  @keyframes particle-1 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(-30px, -40px); opacity: 0;} }
  @keyframes particle-2 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(30px, -40px); opacity: 0;} }
  @keyframes particle-3 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(-20px, 30px); opacity: 0;} }
  @keyframes particle-4 { 0% { transform: translate(0,0); opacity: 1;} 100% { transform: translate(20px, 30px); opacity: 0;} }

@keyframes confetti-fall {
  0% {
    transform: translate(0, 0) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
}
  /* Class Mapping */
  .animate-float-up { animation: float-up 1.5s ease-out forwards; }
  .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  
  /* 設定為 3s，剛好對應 JS 的 setTimeout */
  .animate-pop-and-vanish { animation: pop-and-vanish 3s ease-in-out forwards; }
  .animate-fade-out-end { animation: fade-out-end 3s linear forwards; }
  
  .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
  .animate-spin-slow { animation: spin-slow 10s linear infinite; }
  
  .animate-particle-1 { animation: particle-1 0.8s ease-out forwards; }
  .animate-particle-2 { animation: particle-2 0.8s ease-out forwards; }
  .animate-particle-3 { animation: particle-3 0.8s ease-out forwards; }
  .animate-particle-4 { animation: particle-4 0.8s ease-out forwards; }
  
  .text-stroke-2 { -webkit-text-stroke: 1.5px rgba(0,0,0,0.3); }
  
  /* confetti：通用爆開（每片吃 --dx/--dy/--rot） */
.confetti-piece {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 2px;
  opacity: 0;
  animation: confetti-burst 1.6s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes confetti-burst {
  0%   { opacity: 0; transform: translate(0, 0) rotate(0) scale(0.9); }
  8%   { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1); }
}

  
`;

const STYLE_ID = "score-feedback-styles";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = STYLE_ID;
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}