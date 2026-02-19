import React, { useState, Suspense, lazy, useEffect } from 'react';
import { 
  Monitor, Layout, Grid, ClipboardCheck, Mail, Link, Users,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop, Loader2, Database,
  Type, Download, CheckCircle2 // ✅ 新增引入 Icon
} from 'lucide-react';

import { UI_THEME } from './utils/constants';
import usePersistentState from './hooks/usePersistentState'; 
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { OSProvider, useOS } from './context/OSContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { ModalProvider } from './context/ModalContext';


// 引入全域備份模組
import GlobalBackupModal from './components/common/GlobalBackupModal';
import ZhuyinSettingsModal from './components/common/ZhuyinSettingsModal'; // ✅ 新增引入

const ClassroomDashboardV2 = lazy(() => import('./ClassroomDashboardV2.jsx'));
const ExamTool = lazy(() => import('./pages/ExamTool/ExamTool.jsx'));
const ClassroomManager = lazy(() => import('./ClassroomManager.jsx'));

const LoadingScreen = () => (
  <div className={`w-full h-full flex flex-col items-center justify-center ${UI_THEME.BACKGROUND}`}>
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="p-4 rounded-2xl bg-white/10 shadow-xl backdrop-blur-md border border-white/20">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
      <div className={`font-bold text-lg ${UI_THEME.TEXT_SECONDARY}`}>
        應用程式載入中...
      </div>
    </div>
  </div>
);

const APPS = [
  { id: 'dashboard', name: '電子看板', icon: Monitor, color: 'bg-blue-500', component: ClassroomDashboardV2 },
  { id: 'exam', name: '監考系統', icon: ClipboardCheck, color: 'bg-rose-500', component: ExamTool },
  { id: 'manager', name: '班級經營', icon: Users, color: 'bg-amber-500', component: ClassroomManager },
];

// --- 升級後的 AppLauncher (包含全域注音設定) ---
const AppLauncher = ({ 
  isOpen, onClose, onSelect,   
}) => {
  const { theme, cycleTheme } = useThemeContext();
	const { 
		currentAppId, setCurrentAppId, 
		launcherPosition, setLauncherPosition,
		isGlobalZhuyin // 用來顯示小綠點
	  } = useOS();


const [isBackupOpen, setIsBackupOpen] = useState(false);
const [isZhuyinSettingsOpen, setIsZhuyinSettingsOpen] = useState(false); // ✅ 新增 Modal 狀態

  if (!isOpen) return null;

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Moon size={20} />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return '系統設定';
    if (theme === 'light') return '淺色模式';
    return '深色模式';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      
	  <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />      
      {/* 呼叫注音 Modal (它內部也會自己去抓 useOS，所以不用傳 props 了！) */}
      <ZhuyinSettingsModal 
        isOpen={isZhuyinSettingsOpen} 
        onClose={() => setIsZhuyinSettingsOpen(false)}
      />

      <div className={`${UI_THEME.SURFACE_GLASS} p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-5xl w-full mx-4 border ${UI_THEME.BORDER_LIGHT} relative flex flex-col min-h-[600px] transition-all`} onClick={e => e.stopPropagation()}>
          
         <div className="flex-1">
             {/* Header 區域 */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h2 className={`text-2xl md:text-3xl font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
                      <Layout className="text-indigo-600 dark:text-indigo-400" /> 智慧教室儀表板
                    </h2>
                    
                    <button 
                        onClick={() => setIsBackupOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        <Database size={16} />
                        <span>資料中樞</span>
                    </button>
					
					{/* 2. ✅ 新增：注音設定按鈕 (獨立出來了！) */}
                        <button 
                            onClick={() => setIsZhuyinSettingsOpen(true)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-sm ${
                                isGlobalZhuyin 
                                ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                            title="注音顯示與字型設定"
                        >
                            <Type size={16} />
                            <span className="hidden sm:inline">注音設定</span>
                            {/* 如果已開啟，顯示一個小綠點 */}
                            {isGlobalZhuyin && <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse ml-0.5" />}
                        </button>
					
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={cycleTheme}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm ${UI_THEME.BTN_SECONDARY}`}
                    >
                        {getThemeIcon()}
                        <span className="hidden sm:inline">{getThemeLabel()}</span>
                    </button>

                    <div className={`flex items-center gap-1 ${UI_THEME.SURFACE_CARD} border ${UI_THEME.BORDER_LIGHT} p-1 rounded-lg`}>
						<button onClick={() => setLauncherPosition('left')} className={`p-1.5 rounded-md transition-all ${launcherPosition === 'left' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}><ArrowLeftToLine size={14}/></button>
                        <button onClick={() => setLauncherPosition('right')} className={`p-1.5 rounded-md transition-all ${launcherPosition === 'right' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}><ArrowRightToLine size={14}/></button>
                    </div>
                </div>
             </div>

             {/* APP Grid 區域 */}
             <h3 className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY} mb-4 ml-1 uppercase tracking-wider`}>應用程式</h3>
             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
				{APPS.map(app => (
                 <button 
                   key={app.id} 
                   // ✅ 這裡直接呼叫 Context 的 setCurrentAppId
                   onClick={() => { setCurrentAppId(app.id); onClose(); }}
                   className="group flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 p-4 rounded-[2rem] hover:bg-white/50 dark:hover:bg-white/5"
                 >
                   <div className={`w-24 h-24 rounded-3xl shadow-lg flex items-center justify-center text-white transition-all group-hover:shadow-xl group-hover:-translate-y-1 ${app.color}`}>
                     <app.icon size={40} />
                   </div>
                   <div className="text-center">
                       <div className={`text-base font-bold ${UI_THEME.TEXT_PRIMARY} mb-0.5`}>{app.name}</div>
                   </div>
                 </button>
               ))}
               
               {/* 虛擬的開發中圖示 */}
               <div className="flex flex-col items-center gap-3 opacity-30 grayscale pointer-events-none p-4">
                   <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                     <span className="text-4xl font-thin">+</span>
                   </div>
                   <span className={`text-sm font-bold ${UI_THEME.TEXT_MUTED}`}>Coming Soon</span>
               </div>
             </div>
         </div>

         {/* Footer */}
         <div className={`mt-8 pt-6 border-t ${UI_THEME.BORDER_DEFAULT} text-center ${UI_THEME.TEXT_MUTED}`}>
             <div className={`font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>Developed by 阿保老師</div>
             <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs md:text-sm">
                <a href="mailto:apaul@g.lnps.tp.edu.tw" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Mail size={14} /> apaul@g.lnps.tp.edu.tw
                </a>
                <span className="hidden md:inline opacity-30">|</span>
                <a href="https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link size={14} /> 阿保老師的教室
                </a>
             </div>
         </div>
         
      </div>
    </div>
  );
};

const ClassroomOS = () => {
  const { theme, cycleTheme } = useThemeContext();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  
  // ✅ 從 OS Context 取得關鍵狀態
  const { currentAppId, launcherPosition } = useOS();

  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;
  const buttonPositionClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`relative w-full h-screen ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className={`fixed bottom-4 ${buttonPositionClass} z-[90] p-3 bg-black/5 dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm shadow-sm hover:shadow-xl`}
      >
        <Grid size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />
      </button>

      <div className="w-full h-full">
         <Suspense fallback={<LoadingScreen />}>
            {/* ⚠️ 注意：這裡不再需要傳遞 isGlobalZhuyin 了！因為 CurrentComponent 內部會自己去用 useOS() */}
            <CurrentComponent 
                theme={theme} 
                cycleTheme={cycleTheme} 
            />
         </Suspense>
      </div>

      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
      />
    </div>
  );
};

const App = () => (
  <OSProvider>
    <ClassroomProvider> {/* 讓所有 App 共享班級資料 */}
      <ModalProvider>     {/* 讓所有 App 共享彈窗控制 */}
        <ThemeProvider>   {/* 讓所有 App 共享主題 */}
           <ClassroomOS />
        </ThemeProvider>
      </ModalProvider>
    </ClassroomProvider>
  </OSProvider>
);


export default App;