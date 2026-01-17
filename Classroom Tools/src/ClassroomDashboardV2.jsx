import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, Clock, MapPin, Coffee, BookOpen, Edit3, X, 
  Bell, Calendar, Sun, Moon, Star, Maximize, Minimize, 
  Box, Play, Pause, RotateCcw, Shuffle, Megaphone, Home,
  LogOut, LogIn, UserX, Library, Tent, Trees, MonitorPlay,
  Utensils, Droplet, Waves, ArrowRight
} from 'lucide-react';

// 引入新拆分的設定組件 (請確保路徑正確)
import SettingsModal from './components/modals/SettingsModal';

// --- 預設資料 (Constants) ---
const DEFAULT_TIME_SLOTS = [
  { id: 'arrival', name: '上學時間', start: '07:20', end: '07:50', type: 'break' },
  { id: 'morning', name: '晨光時間', start: '07:50', end: '08:25', type: 'class' },
  { id: 'break1', name: '下課', start: '08:25', end: '08:30', type: 'break' },
  { id: 'p1', name: '第一節', start: '08:30', end: '09:10', type: 'class' },
  { id: 'break2', name: '下課', start: '09:10', end: '09:20', type: 'break' },
  { id: 'p2', name: '第二節', start: '09:20', end: '10:00', type: 'class' },
  { id: 'break3', name: '大下課', start: '10:00', end: '10:20', type: 'break' }, 
  { id: 'p3', name: '第三節', start: '10:20', end: '11:00', type: 'class' },
  { id: 'break4', name: '下課', start: '11:00', end: '11:10', type: 'break' },
  { id: 'p4', name: '第四節', start: '11:10', end: '11:50', type: 'class' },
  { id: 'lunch_prep', name: '準備午餐', start: '11:50', end: '12:00', type: 'break' }, 
  { id: 'lunch', name: '午餐時間', start: '12:00', end: '12:40', type: 'break' },
  { id: 'nap', name: '午休時間', start: '12:40', end: '13:15', type: 'break' }, 
  { id: 'break_noon', name: '準備上課', start: '13:15', end: '13:20', type: 'break' }, 
  { id: 'p5', name: '第五節', start: '13:20', end: '14:00', type: 'class' },
  { id: 'break6', name: '下課', start: '14:00', end: '14:10', type: 'break' },
  { id: 'p6', name: '第六節', start: '14:10', end: '14:50', type: 'class' },
  { id: 'cleaning', name: '打掃時間', start: '14:50', end: '15:10', type: 'break' },
  { id: 'p7', name: '第七節', start: '15:10', end: '15:50', type: 'class' },
  { id: 'after', name: '放學', start: '15:50', end: '16:10', type: 'break' },
];

const DEFAULT_SCHEDULE = {
  1: { p1: '國語', p2: '數學', p3: '生活(視覺)', p4: '生活(視覺)', p5: '綜合', p6: '綜合', p7: '' },
  2: { p1: '數學', p2: '國語', p3: '體育', p4: '英語', p5: '國語', p6: '有品麗山幸福悅讀', p7: '' },
  3: { p1: '國語', p2: '數學', p3: '本土語', p4: '生活(音樂)', p5: '', p6: '', p7: '' },
  4: { p1: 'Reading Fun', p2: '國語', p3: '數學', p4: '生活', p5: '視覺藝術', p6: '視覺藝術', p7: '' },
  5: { p1: '數學', p2: '國語', p3: '理財悠遊趣', p4: '健康', p5: 'STEAM手創館', p6: 'STEAM手創館', p7: '' },
};

const DEFAULT_DAY_TYPES = {
  1: 'full', 2: 'full', 3: 'half', 4: 'full', 5: 'full', 6: 'full', 0: 'full'
};

const DEFAULT_SUBJECT_HINTS = {
  '晨光時間': '抄寫聯絡簿以及準備交作業',
  '全天打掃': '請拿起掃具，認真打掃環境，保持整潔', 
  '打掃時間': '請拿起掃具，認真打掃環境，保持整潔', 
  '準備午餐': '請洗手，拿出餐具，準備用餐',
  '午餐時間': '請細嚼慢嚥，保持桌面整潔，安靜用餐',
  '午休時間': '請趴下休息，保持安靜，不隨意走動',
  '準備上課': '午休結束，請起床洗臉，準備上課',
  '晨間閱讀': '請安靜閱讀，享受書本的樂趣',
  '國語': '準備國語課本、習作、鉛筆盒',
  '數學': '準備數學課本、附件、圓規、直尺',
  '自然': '準備自然課本、習作、觀察紀錄本',
  '社會': '準備社會課本、習作',
  '英語': '準備英語課本、習作、點讀筆',
  '本土語': '準備本土語課本、相關教材',
  '生活': '準備生活課本、習作',
  '生活(視覺)': '攜帶彩色筆、水彩、圍裙，保持整潔', 
  '生活(音樂)': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺藝術': '攜帶水彩、畫筆、調色盤，至美勞教室', 
  '音樂': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺/音樂': '攜帶相關藝文用具(畫具或樂器)',
  '體育': '穿著運動服，攜帶水壺、毛巾，至操場集合',
  '健康': '準備健康課本、習作',
  '游泳': '攜帶泳衣、泳帽、蛙鏡、浴巾，至游泳池集合',
  '綜合': '準備綜合活動課本或小組討論資料',
  'STEAM手創館': '請至電腦教室集合，攜帶筆記本',
  'Reading Fun': '準備英語讀本，保持愉快心情',
  '有品麗山幸福悅讀': '準備喜歡的書，靜心閱讀',
  '理財悠遊趣': '準備理財學習單或相關教具',
  '閱讀': '攜帶借閱證，安靜排隊至圖書館',
  'default': '準備下節課本，喝水上廁所',
  '放學': '請收拾好書包，拿好餐袋及個人物品到走廊排隊'
};

// 這是新的整合式按鈕結構定義 (不再直接用於渲染，而是作為選單資料源)
const SYSTEM_BUTTONS_CONFIG = {
  groups: [
    {
      id: 'move',
      label: '移動/集合',
      icon: MapPin,
      color: 'bg-emerald-600',
      items: [
        { id: 'playground', label: '操場', message: '全班在操場', sub: '請攜帶水壺/毛巾，體育課/戶外活動', icon: Trees, color: 'from-green-500 to-emerald-400' },
        { id: 'library', label: '圖書館', message: '全班在圖書館', sub: '請攜帶借書證，保持安靜', icon: Library, color: 'from-blue-500 to-cyan-400' },
        { id: 'activity_center', label: '活動中心', message: '全班在活動中心', sub: '週會/宣導活動，請依序入座', icon: Tent, color: 'from-purple-500 to-violet-400' },
        { id: 'computer_lab', label: '電腦教室', message: '全班在電腦教室', sub: '資訊課程，請帶筆記本', icon: MonitorPlay, color: 'from-indigo-500 to-blue-500' },
        { id: 'swimming_pool', label: '游泳池', message: '全班在游泳池', sub: '請攜帶泳具、毛巾', icon: Waves, color: 'from-cyan-500 to-blue-600' },
        { id: 'av_room', label: '視聽教室', message: '全班在視聽教室', sub: '觀賞影片/講座，請保持安靜', icon: MonitorPlay, color: 'from-rose-400 to-red-500' }, // 注意: 這裡為了簡化 import, 暫時重複使用 MonitorPlay
      ]
    },
    {
      id: 'status',
      label: '作息/狀態',
      icon: Coffee,
      color: 'bg-indigo-600',
      items: [
        { id: 'morning_read', label: '晨間閱讀', message: '晨間閱讀', sub: '請安靜閱讀，享受書本樂趣', type: 'dark', icon: BookOpen, color: 'from-amber-900 to-orange-950' },
        { id: 'nap', label: '午休', message: '午休時間', sub: '請趴下休息，保持安靜', type: 'dark', icon: Moon, color: 'from-indigo-950 to-slate-900' },
        { id: 'lunch', label: '午餐', message: '午餐時間', sub: '請細嚼慢嚥，保持桌面整潔', icon: Utensils, color: 'from-orange-400 to-amber-500' },
        { id: 'cleaning', label: '打掃', message: '打掃時間', sub: '請拿起掃具，認真打掃環境', icon: Droplet, color: 'from-cyan-400 to-blue-500' },
        { id: 'after_school', label: '放學', message: '放學時間', sub: '請收拾書包，座位淨空', icon: Home, color: 'from-green-500 to-emerald-600' },
        { id: 'teacher_meeting', label: '老師開會', message: '老師處理公務中', sub: '請安靜進行班級活動', type: 'dark', icon: UserX, color: 'from-slate-700 to-slate-900' },
      ]
    }
  ],
  singles: [
    { id: 'back_classroom', label: '回教室', message: '請盡速回教室', sub: '下課後，準備下一節課程', icon: LogIn, color: 'bg-blue-600' },
    { id: 'corridor', label: '走廊排隊', message: '走廊排隊中', sub: '靠上椅子，在走廊安靜排隊', icon: LogOut, color: 'bg-orange-500' },
  ]
};

const DEFAULT_CUSTOM_BROADCASTS = [
  { id: 1, name: '常用1', title: '全班集合', sub: '請到走廊排隊' },
  { id: 2, name: '常用2', title: '安靜自習', sub: '請拿出課本閱讀' },
  { id: 3, name: '常用3', title: '放學準備', sub: '抄寫聯絡簿，整理書包' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const getSecondsFromTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
};

// --- 共用元件 ---

// 安靜/深色模式視圖
const QuietModeView = ({ title, subtext, icon: IconComponent, centerContent, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
      <Star className="absolute top-10 right-20 text-yellow-100 opacity-40 w-4 h-4 animate-ping pointer-events-none" />
      <Star className="absolute bottom-10 left-20 text-yellow-100 opacity-30 w-6 h-6 animate-pulse pointer-events-none" />
      <Star className="absolute top-1/3 left-10 text-blue-200 opacity-20 w-3 h-3 animate-pulse delay-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full">
         <div className="mb-12 flex flex-col items-center">
            {IconComponent && <IconComponent size={80} className="text-indigo-200 mb-6 drop-shadow-[0_0_15px_rgba(199,210,254,0.5)]" />}
            <h2 className="text-6xl font-bold text-indigo-100 tracking-wider mb-4">{title}</h2>
            <p className="text-2xl text-indigo-300 font-light">{subtext}</p>
         </div>
         {centerContent}
         {onClose && (
           <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 group" title="回到主畫面 (Esc)">
             <X size={32} className="group-hover:scale-110 transition-transform"/>
           </button>
         )}
      </div>
    </div>
  );
};

// --- 工具箱 Modal ---
const ToolsModal = ({ isOpen, onClose }) => {
  // ... (此處保留原有的 ToolsModal 程式碼，為節省篇幅省略，請直接使用原檔案內容) ...
  // 請確認這裡的內容與原本一致
  return null; // 這裡僅為示意，實作時請貼上原有的 ToolsModal 內容
};

// --- 廣播輸入 Modal (升級版) ---
const BroadcastInputModal = ({ isOpen, onClose, onConfirm, customPresets, setCustomPresets }) => {
  // ... (此處保留原有的 BroadcastInputModal 程式碼，請直接使用原檔案內容) ...
  return null; // 這裡僅為示意
};

// ... CircularProgress ... (保持不變)
const CircularProgress = ({ progress, size = 300, strokeWidth = 15, children, colorClass }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle className="text-slate-200/30" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle className={`transition-all duration-1000 ease-linear ${colorClass}`} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">{children}</div>
    </div>
  );
};

// ... MessageInput ... (保持不變)
const MessageInput = ({ isOpen, onClose, message, setMessage }) => {
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message, isOpen]);
  const fontSizeClass = message.length > 50 ? 'text-xl' : (message.length > 20 ? 'text-2xl' : 'text-3xl');

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
       <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 flex flex-col gap-4">
          <h3 className="text-2xl font-bold text-slate-700">新增便利貼留言 (可換行)</h3>
          <textarea ref={textareaRef} autoFocus value={message} onChange={e => setMessage(e.target.value)} className={`w-full font-bold p-4 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:outline-none resize-none overflow-hidden ${fontSizeClass}`} placeholder="例如：請將聯絡簿交到講桌&#10;記得帶水壺" rows={3} style={{ minHeight: '120px', maxHeight: '400px' }} />
          <div className="flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">完成</button>
             <button onClick={() => { setMessage(''); onClose(); }} className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50">清除</button>
          </div>
       </div>
    </div>
  );
};

// --- ControlDock (升級版 - 整合式選單) ---
const ControlDock = ({ 
  statusMode, setSpecialStatus, setIsManualEco, isFullscreen, toggleFullScreen, setShowSettings, isAutoNapActive, onBroadcastClick, visibleButtons 
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  if (statusMode === 'eco' || statusMode === 'special' || isAutoNapActive) return null;
  const isDark = statusMode === 'off-hours';
  const toggleDropdown = (id) => setActiveDropdown(prev => prev === id ? null : id);
  const getVisibleItems = (items) => items.filter(item => visibleButtons.includes(item.id));

  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl shadow-2xl border flex items-center gap-2 whitespace-nowrap z-50 transition-all backdrop-blur-md max-w-[95vw] overflow-visible no-scrollbar hover:scale-105 ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-white/50'}`}>
      <button onClick={onBroadcastClick} className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-1`}>
        <Megaphone size={16} /> 自訂廣播
      </button>
      <div className={`w-px h-6 mx-1 shrink-0 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
      {SYSTEM_BUTTONS_CONFIG.singles.filter(btn => visibleButtons.includes(btn.id)).map(btn => (
        <button key={btn.id} onClick={() => setSpecialStatus(btn)} className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 bg-gradient-to-br flex items-center gap-1 ${btn.color}`}>
          <btn.icon size={16} /> {btn.label}
        </button>
      ))}
      {SYSTEM_BUTTONS_CONFIG.groups.map(group => {
          const visibleItems = getVisibleItems(group.items);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.id} className="relative group">
                <button onClick={(e) => { e.stopPropagation(); toggleDropdown(group.id); }} className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 flex items-center gap-1 ${group.color} ${activeDropdown === group.id ? 'ring-2 ring-white ring-opacity-50' : ''}`}>
                    <group.icon size={16} /> {group.label}
                </button>
                {activeDropdown === group.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200 origin-bottom z-50">
                        {visibleItems.map(item => (
                            <button key={item.id} onClick={() => setSpecialStatus(item)} className={`w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3 text-slate-700 font-bold`}>
                                <div className={`p-2 rounded-full text-white bg-gradient-to-br ${item.color}`}><item.icon size={14} /></div>
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          );
      })}
      <div className={`w-px h-6 mx-1 shrink-0 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
      <button onClick={(e) => { e.stopPropagation(); setIsManualEco(true); }} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`} title="時鐘模式 (省電)"><Clock size={20} /></button>
      <button onClick={toggleFullScreen} className={`p-2 rounded-xl transition-all hover:-translate-y-1 shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`} title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}>
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl shadow-lg transition-all hover:-translate-y-1 shrink-0 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}><Settings size={20} /></button>
    </div>
  );
};

// --- TimelineSidebar (Extracted Component - Memoized) ---
const SidebarHeader = ({ now, is24Hour, dayTypes }) => {
  const rocYear = now.getFullYear() - 1911;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const dateNum = now.getDate().toString().padStart(2, '0');
  const week = WEEKDAYS[now.getDay()];
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const dayTypeLabel = isWeekend ? '假日' : (dayTypes[day] === 'full' ? '全天課' : '半天課');

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg shrink-0">
      <div className="text-4xl font-mono font-bold tracking-tight">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}</div>
      <div className="text-blue-100 mt-2 text-sm font-medium flex flex-col gap-1">
        <span>民國{rocYear}年{month}月{dateNum}日</span>
        <div className="flex justify-between items-center"><span>星期{week}</span><span className={`px-2 py-0.5 bg-white/20 rounded-md text-xs border border-white/10 shadow-sm ${isWeekend ? 'bg-red-500/30 border-red-400/50' : ''}`}>{dayTypeLabel}</span></div>
      </div>
    </div>
  );
};

const SidebarList = React.memo(({ displaySlots, daySchedule, currentSlotId, nextSlotId }) => {
  const activeRef = useRef(null);
  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentSlotId]); 

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar">
      {displaySlots.map((slot) => {
        const subject = daySchedule[slot.id] || slot.name;
        const isCurrent = currentSlotId === slot.id;
        const isNext = nextSlotId === slot.id;
        return (
          <div key={slot.id} ref={isCurrent ? activeRef : null} className={`relative p-4 rounded-xl transition-all duration-500 ${isCurrent ? 'bg-indigo-600 border-l-4 border-indigo-400 shadow-md transform scale-105 z-10' : (isNext ? 'bg-blue-50 border-l-4 border-blue-400 shadow-sm border-dashed' : 'bg-slate-50/50 border-l-4 border-transparent opacity-60 grayscale')}`}>
             {isNext && <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold animate-pulse">NEXT</div>}
            <div className={`flex justify-between items-center text-xs font-mono mb-1 ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}><span>{slot.start}</span><span>{slot.end}</span></div>
            <div className={`text-lg font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-600'}`}>{subject || slot.name}</div>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (prevProps.currentSlotId === nextProps.currentSlotId && prevProps.nextSlotId === nextProps.nextSlotId && prevProps.daySchedule === nextProps.daySchedule && prevProps.displaySlots === nextProps.displaySlots);
});

const TimelineSidebar = ({ now, schedule, activeTimeSlots, currentSlot, nextSlot, is24Hour, dayTypes }) => {
  const daySchedule = schedule[now.getDay()] || {};
  const currentSlotId = currentSlot?.id;
  const nextSlotId = nextSlot?.id;
  const displaySlots = useMemo(() => activeTimeSlots.filter(s => (s.type === 'class' || [ 'lunch', 'cleaning'].includes(s.id)) && s.id !== 'lunch_prep'), [activeTimeSlots]);

  return (
    <div className="w-64 h-full bg-white/80 backdrop-blur-md border-r border-white/20 flex flex-col shadow-xl z-20">
      <SidebarHeader now={now} is24Hour={is24Hour} dayTypes={dayTypes} />
      <SidebarList displaySlots={displaySlots} daySchedule={daySchedule} currentSlotId={currentSlotId} nextSlotId={nextSlotId} />
    </div>
  );
};

// ... App (ClassroomDashboardV2) ...
const ClassroomDashboardV2 = () => {
  const [timeSlots, setTimeSlots] = useState(() => JSON.parse(localStorage.getItem('timeSlots')) || DEFAULT_TIME_SLOTS);
  const [schedule, setSchedule] = useState(() => JSON.parse(localStorage.getItem('schedule')) || DEFAULT_SCHEDULE);
  const [subjectHints, setSubjectHints] = useState(() => JSON.parse(localStorage.getItem('subjectHints')) || DEFAULT_SUBJECT_HINTS);
  const [is24Hour, setIs24Hour] = useState(() => { const saved = localStorage.getItem('is24Hour'); return saved !== null ? JSON.parse(saved) : true; });
  const [dayTypes, setDayTypes] = useState(() => JSON.parse(localStorage.getItem('dayTypes')) || DEFAULT_DAY_TYPES);
  const [customPresets, setCustomPresets] = useState(() => JSON.parse(localStorage.getItem('customPresets')) || DEFAULT_CUSTOM_BROADCASTS);
  const [visibleButtons, setVisibleButtons] = useState(() => {
      const saved = localStorage.getItem('visibleButtons');
      if (saved) return JSON.parse(saved);
      return [...SYSTEM_BUTTONS_CONFIG.singles.map(b => b.id), ...SYSTEM_BUTTONS_CONFIG.groups.flatMap(g => g.items.map(b => b.id))];
  });

  const [teacherMessage, setTeacherMessage] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  const [showBroadcastInput, setShowBroadcastInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); 
  const [now, setNow] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); 
  const [statusMode, setStatusMode] = useState('loading'); 
  const [specialStatus, setSpecialStatus] = useState(null);
  const [isManualEco, setIsManualEco] = useState(false); 
  const [isAutoEcoOverride, setIsAutoEcoOverride] = useState(false);
  const [dismissedNap, setDismissedNap] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [nextSlot, setNextSlot] = useState(null);
  const [progress, setProgress] = useState(100);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [saverPos, setSaverPos] = useState({ x: 0, y: 0 });

  // 鍵盤與時間邏輯 (省略重複代碼，保留核心邏輯)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSettings || showBroadcastInput || isEditingMessage) return;
      if (e.key === 'f' || e.key === 'F') toggleFullScreen();
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        if (showTools) setShowTools(false);
        if (showBroadcastInput) setShowBroadcastInput(false);
        if (specialStatus) setSpecialStatus(null);
        if (isEditingMessage) setIsEditingMessage(false);
        if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showTools, showBroadcastInput, specialStatus, isEditingMessage, dismissedNap, statusMode]);

  // Active Time Slots Logic
  const activeTimeSlots = useMemo(() => {
    const day = now.getDay();
    if (day === 0 || day === 6) return []; 
    const isHalfDay = dayTypes[day] === 'half';
    if (!isHalfDay) return timeSlots;
    const halfDaySlots = [];
    let isDismissed = false;
    const p5Start = timeSlots.find(s => s.id === 'p5')?.start || '13:20';
    for (let slot of timeSlots) {
       if (isDismissed) continue;
       if (slot.id === 'break3') { halfDaySlots.push({ ...slot, name: '打掃時間' }); continue; }
       if (getSecondsFromTime(slot.start) >= getSecondsFromTime(p5Start)) {
          halfDaySlots.push({ id: 'after', name: '放學', start: slot.start, end: '17:00', type: 'break' });
          isDismissed = true;
          continue;
       }
       halfDaySlots.push(slot);
    }
    return halfDaySlots;
  }, [timeSlots, dayTypes, now.getDay()]);

  const isNapTime = currentSlot?.name.includes('午休') || currentSlot?.id === 'nap';
  const isDismissal = currentSlot?.name.includes('放學') || currentSlot?.id === 'after';
  const isAutoNapActive = (isNapTime || isDismissal) && !dismissedNap && statusMode === 'break';

  // Effects
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date(Date.now() + timeOffset)), 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);
  useEffect(() => {
    if (statusMode === 'eco') {
      const interval = setInterval(() => setSaverPos({ x: Math.floor(Math.random() * 100 - 50), y: Math.floor(Math.random() * 100 - 50) }), 60000);
      return () => clearInterval(interval);
    }
  }, [statusMode]);
  useEffect(() => {
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('subjectHints', JSON.stringify(subjectHints));
    localStorage.setItem('is24Hour', JSON.stringify(is24Hour));
    localStorage.setItem('dayTypes', JSON.stringify(dayTypes));
    localStorage.setItem('customPresets', JSON.stringify(customPresets));
    localStorage.setItem('visibleButtons', JSON.stringify(visibleButtons));
  }, [timeSlots, schedule, subjectHints, customPresets, visibleButtons, is24Hour, dayTypes]);
  useEffect(() => {
    if (!showSettings) { setIsAutoEcoOverride(false); setDismissedNap(false); }
  }, [currentSlot?.id, showSettings]);

  // Main Status Logic
  useEffect(() => {
    if (specialStatus) { setStatusMode('special'); return; }
    if (isManualEco) { setStatusMode('eco'); return; }
    const currentTimeSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let foundSlot = null;
    let nextClass = null;
    const sortedSlots = [...activeTimeSlots].sort((a, b) => getSecondsFromTime(a.start) - getSecondsFromTime(b.start));
    if (activeTimeSlots.length === 0) { setStatusMode('off-hours'); setCurrentSlot(null); setNextSlot(null); return; }
    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startSec = getSecondsFromTime(slot.start);
      const endSec = getSecondsFromTime(slot.end);
      if (currentTimeSec >= startSec && currentTimeSec < endSec) {
        foundSlot = slot;
        for (let j = i + 1; j < sortedSlots.length; j++) { if (sortedSlots[j].type === 'class') { nextClass = sortedSlots[j]; break; } }
        break;
      }
    }
    setCurrentSlot(foundSlot);
    setNextSlot(nextClass);
    if (!foundSlot) { setStatusMode('off-hours'); return; }
    if (foundSlot.type === 'class') {
      const startSec = getSecondsFromTime(foundSlot.start);
      const elapsed = currentTimeSec - startSec;
      if (elapsed > 180 && !isAutoEcoOverride) setStatusMode('eco'); else setStatusMode('class');
    } else {
      const startSec = getSecondsFromTime(foundSlot.start);
      const endSec = getSecondsFromTime(foundSlot.end);
      const total = endSec - startSec;
      const remain = endSec - currentTimeSec;
      setSecondsRemaining(remain);
      setProgress(Math.max(0, Math.min(100, (remain / total) * 100)));
      if (remain <= 60 && remain > 0) setStatusMode('pre-bell'); else setStatusMode('break');
    }
  }, [now, activeTimeSlots, specialStatus, isManualEco]);

  // View Components (簡化保留，實作邏輯不變)
  const getNextSubjectName = () => {
    if (!nextSlot) return '放學';
    const daySchedule = schedule[now.getDay()];
    if (!daySchedule) return '無課表';
    return daySchedule[nextSlot.id] || nextSlot.name;
  };
  const getSystemHint = () => {
    if (currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning')) return subjectHints['全天打掃'] || subjectHints['打掃時間'] || '請拿起掃具，認真打掃環境，保持整潔';
    if (currentSlot && (currentSlot.name.includes('午餐') || currentSlot.name.includes('午休') || currentSlot.name.includes('放學'))) return subjectHints[currentSlot.name] || '請保持安靜';
    const subject = getNextSubjectName();
    return subjectHints[subject] || subjectHints['default'];
  };
  const formatCountdown = (secs) => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;
  const formatROCDate = (date) => {
    const rocYear = date.getFullYear() - 1911;
    const week = WEEKDAYS[date.getDay()];
    return `民國${rocYear}年${(date.getMonth() + 1).toString().padStart(2,'0')}月${date.getDate().toString().padStart(2,'0')}日 星期${week}`;
  };

  const BreakView = () => {
    const isPreBell = statusMode === 'pre-bell';
    const isNap = currentSlot?.name.includes('午休'); 
    const isDismissal = currentSlot?.name.includes('放學');
    const isCleaning = currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning');
    const isLunch = currentSlot && currentSlot.name.includes('午餐');
    const progressColor = (isNap || isDismissal) ? 'text-indigo-400' : (isPreBell ? 'text-red-500' : (progress > 50 ? 'text-emerald-500' : 'text-amber-400'));
    
    if ((isNap || isDismissal) && !dismissedNap) {
      const title = isNap ? "午休時間" : "放學時間";
      const subtext = isNap ? "Shhh... 請保持安靜，好好休息" : "請收拾書包，準備回家";
      const icon = isNap ? Moon : Home;
      return <QuietModeView title={title} subtext={subtext} icon={icon} onClose={() => setDismissedNap(true)} centerContent={<div className="flex flex-col items-center"><div className="text-8xl font-mono font-bold text-slate-200 drop-shadow-2xl">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}</div><div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-indigo-200"><span className="mr-4">{isNap ? '💤' : '🏠'}</span>{getSystemHint()}</div></div>} />;
    }

    return (
      <div className={`flex-1 relative overflow-hidden transition-colors duration-1000 ${isPreBell ? 'bg-red-50' : 'bg-slate-100'}`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-start p-8">
            <div className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-white/50"><span className="text-slate-500 font-bold mr-2">目前時段</span><span className="text-2xl font-bold text-slate-800">{currentSlot?.name}</span></div>
            {timeOffset !== 0 && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-bold animate-pulse border border-red-200">⚠️ 時間模擬模式中</div>}
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8 pb-8">
            <div className={`relative transition-all duration-500 ${isPreBell ? 'scale-110' : ''}`}><CircularProgress progress={progress} size={400} strokeWidth={24} colorClass={progressColor}>
                <div className="text-center flex flex-col items-center">
                    <div className="absolute -top-24 bg-white/90 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border-2 border-indigo-100 flex items-center gap-4 transform hover:scale-105 transition-transform z-20"><span className="text-lg font-bold text-slate-400 uppercase tracking-wider">NEXT</span><div className="flex items-center gap-2 text-4xl font-bold text-indigo-600"><ArrowRight size={32} strokeWidth={3} /> {getNextSubjectName()}</div></div>
                    <div className={`text-[7rem] font-bold font-mono tracking-tighter leading-none ${isPreBell ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{formatCountdown(secondsRemaining)}</div><div className="text-slate-400 font-medium mt-2 tracking-widest uppercase">{isPreBell ? '預備鐘響' : 'REMAINING'}</div>
                </div>
            </CircularProgress></div>
            <div className="max-w-xl w-full flex flex-col gap-6">
              {teacherMessage ? (
                    <div onClick={() => setIsEditingMessage(true)} className="bg-yellow-200 p-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform cursor-pointer relative group" style={{ fontFamily: 'cursive, sans-serif' }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-300/50 backdrop-blur-sm rotate-1"></div>
                        <div className="flex justify-between items-start mb-2 opacity-50"><span className="text-xs font-bold uppercase tracking-widest text-yellow-800">MEMO</span><Edit3 size={16} className="text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"/></div>
                        <p className={`font-bold text-slate-800 leading-snug break-words whitespace-pre-wrap ${teacherMessage.length > 50 ? 'text-2xl' : 'text-3xl'}`}>{teacherMessage}</p>
                    </div>
                  ) : (!isPreBell && (<button onClick={() => setIsEditingMessage(true)} className="group flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-yellow-400 hover:bg-yellow-50 transition-all"><Edit3 className="text-slate-400 group-hover:text-yellow-600" /><span className="text-slate-400 font-bold group-hover:text-yellow-700">新增便利貼留言</span></button>))}
              <div className={`bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 transform transition-all duration-500 ${isPreBell ? 'opacity-50 blur-[2px] scale-95' : 'opacity-100 scale-100'}`}><div className="flex items-center gap-4 mb-4"><div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><BookOpen size={32} /></div><div className="text-lg text-slate-500 font-bold">{isCleaning ? '打掃提醒' : (isLunch ? '用餐提醒' : '請準備')}</div></div><div className="text-3xl font-bold text-slate-800 leading-normal">{getSystemHint()}</div></div>
              {isPreBell && (<div className="bg-red-600 text-white p-8 rounded-3xl shadow-2xl border-4 border-red-400 animate-bounce-subtle flex items-center justify-center text-center"><div><h3 className="text-4xl font-bold mb-2">請回座位</h3><p className="text-xl opacity-90">靜候老師上課</p></div></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ClassView = () => (<div className="flex-1 bg-slate-50 flex items-center justify-center p-8"><div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl p-16 text-center border-4 border-slate-100 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div><div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 mb-6"><Bell size={48} /></div><h1 className="text-7xl font-bold text-slate-800 mb-8 tracking-tight">上課了</h1><div className="text-3xl text-slate-500 mb-12 font-medium">現在是 <span className="text-indigo-600 font-bold mx-2">{schedule[now.getDay()]?.[currentSlot?.id] || currentSlot?.name}</span> 時間</div><div className="bg-slate-50 rounded-2xl p-8 max-w-2xl mx-auto"><p className="text-2xl text-slate-700 leading-relaxed">請拿出課本與學用品<br/>保持安靜，專心聽講</p></div></div></div>);
  const OffHoursView = () => (<div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-8 transition-colors duration-1000"><div className="text-center z-10"><div className="mb-8"><div className="text-xl text-blue-300 font-medium mb-2 tracking-widest uppercase">Off-Hours</div><h2 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">非上課時段</h2></div><div className="font-mono text-[8rem] leading-none text-slate-200 font-bold drop-shadow-2xl">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}</div><div className="text-2xl text-slate-400 mt-4 font-light">{formatROCDate(now)}</div></div></div>);
  const EcoView = () => (<div className="flex-1 bg-black relative overflow-hidden cursor-pointer w-full h-full" onClick={() => {setIsManualEco(false);setIsAutoEcoOverride(true);}}><div className="absolute transition-all duration-[2000ms] flex flex-col items-center" style={{ transform: `translate(${saverPos.x}px, ${saverPos.y}px)`, top: '50%', left: '50%', marginTop: '-150px', marginLeft: '-300px', width: '600px' }}><div className="text-[12rem] font-mono font-bold text-slate-800 leading-none select-none">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}</div><div className="mt-4 text-2xl text-slate-900 font-medium border px-4 py-1 rounded-full border-slate-900">{schedule[now.getDay()]?.[currentSlot?.id] || '休息中'}</div></div></div>);
  const SpecialView = () => {
    if (!specialStatus) return null;
    if (specialStatus.type === 'dark' || specialStatus.type === 'alert') return <QuietModeView title={specialStatus.message} subtext={specialStatus.sub} icon={specialStatus.icon} onClose={() => setSpecialStatus(null)} centerContent={<div className="flex flex-col items-center"><div className="text-8xl font-mono font-bold text-slate-200 drop-shadow-2xl">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}</div><div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-indigo-200"><span className="mr-4">📢</span>{subjectHints[specialStatus.message] || specialStatus.sub}</div></div>} />;
    const Icon = specialStatus.icon;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 p-8"><div className={`max-w-6xl w-full aspect-video rounded-[3rem] shadow-2xl flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br text-white relative overflow-hidden ${specialStatus.color || 'from-blue-600 to-indigo-800'}`}><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><Icon size={100} className="mb-8 opacity-90 animate-bounce" /><h1 className="text-[7rem] font-bold mb-4 leading-tight drop-shadow-md">{specialStatus.message}</h1><button onClick={() => setSpecialStatus(null)} className="absolute top-12 right-12 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={32} /></button></div></div>;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans text-slate-800 bg-slate-200 selection:bg-indigo-200">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      {statusMode !== 'eco' && statusMode !== 'off-hours' && <TimelineSidebar now={now} schedule={schedule} activeTimeSlots={activeTimeSlots} currentSlot={currentSlot} nextSlot={nextSlot} is24Hour={is24Hour} dayTypes={dayTypes} />}
      <div className="flex-1 flex flex-col relative">
        {statusMode === 'loading' && <div className="flex-1 flex items-center justify-center">Loading...</div>}
        {(statusMode === 'break' || statusMode === 'pre-bell') && <BreakView />}
        {statusMode === 'class' && <ClassView />}
        {statusMode === 'eco' && <EcoView />}
        {statusMode === 'off-hours' && <OffHoursView />}
        {statusMode === 'special' && specialStatus && <SpecialView />}
        <ControlDock statusMode={statusMode} setSpecialStatus={setSpecialStatus} setIsManualEco={setIsManualEco} isFullscreen={isFullscreen} toggleFullScreen={toggleFullScreen} setShowSettings={setShowSettings} isAutoNapActive={isAutoNapActive} onBroadcastClick={() => setShowBroadcastInput(true)} visibleButtons={visibleButtons} />
        {!(statusMode === 'eco' || statusMode === 'special' || isAutoNapActive) && (<div className="absolute bottom-6 right-6 z-50"><button onClick={() => setShowTools(true)} className="p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-slate-600 hover:text-blue-600 hover:scale-110 transition-all border border-white/50" title="教室小工具"><Box size={24} /></button></div>)}
      </div>
      
      {/* 呼叫新拆分的 SettingsModal，並傳遞所有需要的 props */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        timeSlots={timeSlots} setTimeSlots={setTimeSlots} 
        schedule={schedule} setSchedule={setSchedule} 
        subjectHints={subjectHints} setSubjectHints={setSubjectHints} 
        dayTypes={dayTypes} setDayTypes={setDayTypes} 
        timeOffset={timeOffset} setTimeOffset={setTimeOffset} 
        setIsManualEco={setIsManualEco} setIsAutoEcoOverride={setIsAutoEcoOverride} 
        setNow={setNow} is24Hour={is24Hour} setIs24Hour={setIs24Hour} now={now} 
        visibleButtons={visibleButtons} setVisibleButtons={setVisibleButtons}
        systemButtonsConfig={SYSTEM_BUTTONS_CONFIG}
        defaultValues={{
           TIME_SLOTS: DEFAULT_TIME_SLOTS,
           SCHEDULE: DEFAULT_SCHEDULE,
           SUBJECT_HINTS: DEFAULT_SUBJECT_HINTS,
           DAY_TYPES: DEFAULT_DAY_TYPES
        }}
      />

      <ToolsModal isOpen={showTools} onClose={() => setShowTools(false)} />
      <BroadcastInputModal isOpen={showBroadcastInput} onClose={() => setShowBroadcastInput(false)} onConfirm={(title, sub) => setSpecialStatus({ message: title, sub: sub, color: 'from-pink-500 to-rose-500', type: 'input', id: 99, icon: Megaphone })} customPresets={customPresets} setCustomPresets={setCustomPresets} />
      <MessageInput isOpen={isEditingMessage} onClose={() => setIsEditingMessage(false)} message={teacherMessage} setMessage={setTeacherMessage} />
    </div>
  );
};

export default ClassroomDashboardV2;
