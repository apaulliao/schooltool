import React, { useState, Suspense, lazy, useEffect } from 'react';
import { 
  Monitor, Layout, Grid, ClipboardCheck, Mail, Link, Users,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop, Loader2, Database,
  Type, Download, CheckCircle2, Headphones, LogIn, LogOut
} from 'lucide-react';

import { UI_THEME } from './utils/constants';
import usePersistentState from './hooks/usePersistentState'; 
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { OSProvider, useOS } from './context/OSContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { ModalProvider } from './context/ModalContext';

// 引入 Google 登入
import { useGoogleLogin } from '@react-oauth/google';

// 引入全域備份與設定模組
import GlobalBackupModal from './components/common/GlobalBackupModal';
import ZhuyinSettingsModal from './components/common/ZhuyinSettingsModal'; 
import DialogModal from './components/common/DialogModal';

// 🌟 引入更新公告模組與資料
import PatchNotesModal from './components/common/PatchNotesModal';
import { APP_VERSION } from './utils/patchNotesData';

const ClassroomDashboardV2 = lazy(() => import('./ClassroomDashboardV2.jsx'));
const ExamTool = lazy(() => import('./pages/ExamTool/ExamTool.jsx'));
const ClassroomManager = lazy(() => import('./ClassroomManager.jsx'));
const ExamReader = lazy(() => import('./pages/ExamReader/ExamReader.jsx')); 

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
  { id: 'reader', name: '報讀助理', icon: Headphones, color: 'bg-emerald-500', component: ExamReader },
];

// --- AppLauncher ---
const AppLauncher = ({ 
  isOpen, onClose, user, login, logout, 
  onOpenPatchNotes // 🌟 新增：接收開啟公告的函式
}) => {	
  const { theme, cycleTheme } = useThemeContext();
  const { 
    currentAppId, setCurrentAppId, 
    launcherPosition, setLauncherPosition,
    isGlobalZhuyin
  } = useOS();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isZhuyinSettingsOpen, setIsZhuyinSettingsOpen] = useState(false); 
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  if (!isOpen) return null;

  // 輔助函式：取得主題圖示
  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={18} />;
    if (theme === 'light') return <Sun size={18} />;
    return <Moon size={18} />;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      
      {/* 內層 Modals */}
      <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} user={user} login={login} />      
      <ZhuyinSettingsModal isOpen={isZhuyinSettingsOpen} onClose={() => setIsZhuyinSettingsOpen(false)} />
      <DialogModal
        isOpen={isLogoutModalOpen}
        title="登出確認"
        message="確定要登出 Google 帳號嗎？登出後將無法使用雲端同步與派送功能。"
        type="confirm" variant="warning" confirmText="確定登出" cancelText="取消"
        onConfirm={() => { logout(); setIsLogoutModalOpen(false); }}
        onCancel={() => setIsLogoutModalOpen(false)} onClose={() => setIsLogoutModalOpen(false)}
      />

      {/* 🌟 主要面板：採用更寬敞的版面 */}
      <div 
        className={`${UI_THEME.SURFACE_GLASS} w-full max-w-5xl mx-4 rounded-[2rem] shadow-2xl border ${UI_THEME.BORDER_LIGHT} overflow-hidden flex flex-col min-h-[600px] transition-all`} 
        onClick={e => e.stopPropagation()}
      >
         
         {/* ================= HEADER: 品牌與登入 ================= */}
         <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50">
            
            {/* 左側：品牌 */}
            <h2 className={`text-3xl font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                <Layout size={28} />
              </div>
              <span>智慧教室儀表板</span>
            </h2>

            {/* 右側：使用者登入 (符合一般習慣) */}
            <div className="self-end md:self-auto">
              {user ? (
                <div className="flex items-center gap-3 pl-2 pr-2 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                  {/* Avatar */}
                  {user.picture ? (
                    <img src={user.picture} alt="User" className="w-9 h-9 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}
                  
                  {/* Name & Email */}
                  <div className="flex flex-col pr-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>

                  {/* Logout */}
                  <button 
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-full transition-colors"
                    title="登出"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => login()} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:scale-105"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
                  <span>登入帳號</span>
                </button>
              )}
            </div>
         </div>

         {/* ================= BODY: 工具列與 APP ================= */}
         <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-900/20">
            
            {/* 工具列：系統設定 & 檢視設定 */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                
                {/* 左邊：核心功能 (備份、注音) */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsBackupOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Database size={18} />
                        <span>資料中樞</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsZhuyinSettingsOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                            isGlobalZhuyin 
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                    >
                        <Type size={18} />
                        <span>注音設定</span>
                        {isGlobalZhuyin && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                    </button>
                </div>

                {/* 右邊：檢視偏好 (深色、位置) */}
                <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                        onClick={cycleTheme}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="切換深淺色模式"
                    >
                        {getThemeIcon()}
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={() => setLauncherPosition('left')} className={`p-2 rounded-lg transition-colors ${launcherPosition === 'left' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="按鈕靠左"><ArrowLeftToLine size={18}/></button>
                    <button onClick={() => setLauncherPosition('right')} className={`p-2 rounded-lg transition-colors ${launcherPosition === 'right' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`} title="按鈕靠右"><ArrowRightToLine size={18}/></button>
                </div>
            </div>

            {/* APP Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {APPS.map(app => (
                 <button 
                   key={app.id} 
                   onClick={() => { setCurrentAppId(app.id); onClose(); }}
                   className="group relative flex flex-col items-center gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 hover:-translate-y-1"
                 >
                   <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${app.color}`}>
                     <app.icon size={36} />
                   </div>
                   <span className={`text-base font-bold ${UI_THEME.TEXT_PRIMARY}`}>{app.name}</span>
                 </button>
               ))}
               
               {/* Coming Soon */}
               <div className="flex flex-col items-center gap-4 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 opacity-50 grayscale">
                   <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                     <span className="text-4xl font-thin">+</span>
                   </div>
                   <span className="text-sm font-bold text-slate-400">Coming Soon</span>
               </div>
            </div>
         </div>

         {/* ================= FOOTER: 開發者與版本 ================= */}
         <div className="p-6 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
             
             {/* 開發者資訊 */}
             <div className="flex items-center gap-4 text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">Developed by 阿保老師</span>
                <span className="hidden md:inline opacity-30">|</span>
                <a href="mailto:apaul@g.lnps.tp.edu.tw" className="flex items-center gap-1 hover:text-indigo-500 transition-colors">
                    <Mail size={14} /> 聯絡開發者
                </a>
				<span className="hidden md:inline opacity-30">|</span>
                <a href="https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link size={14} /> 阿保老師的教室
                </a>
             </div>

             {/* 🌟 版本號按鈕 (點擊開啟 Patch Notes) */}
             <button 
                onClick={onOpenPatchNotes}
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 rounded-full transition-all border border-slate-200 dark:border-slate-700 hover:border-indigo-200"
             >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono font-bold text-xs">v{APP_VERSION}</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity -ml-1">查看更新</span>
             </button>
         </div>
         
      </div>
    </div>
  );
};

const ClassroomOS = () => {
  const { theme, cycleTheme } = useThemeContext();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const { currentAppId, setCurrentAppId, launcherPosition } = useOS();

  // 🌟 1. 全域的老師登入狀態與學生派送碼狀態
  const [user, setUser] = usePersistentState('classroom_os_user', null);
  const [shareId, setShareId] = useState(null);

  // 🌟 2. 更新公告狀態管理
  const [showLatestNotes, setShowLatestNotes] = useState(false);
  const [showHistoryNotes, setShowHistoryNotes] = useState(false);

  // 🌟 3. 檢查版本並決定是否彈出更新公告
  useEffect(() => {
    const checkVersion = () => {
      const lastSeenVersion = localStorage.getItem('last_seen_version');
      // 如果是用戶第一次來(null)，或是版本不同，就顯示
      if (lastSeenVersion !== APP_VERSION) {
        // 延遲 1.5 秒顯示，讓主畫面先跑完，體驗較好
        setTimeout(() => setShowLatestNotes(true), 1500);
      }
    };
    checkVersion();
  }, []);
  
  // 🌟 4. 定義全域的 Google 登入 Hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const token = tokenResponse.access_token;
        
        // 拿到 Token 後，立刻去跟 Google 要大頭貼和姓名
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userInfo = await res.json();

        console.log("登入成功，使用者資訊:", userInfo);
        
        // 將完整的資訊存入 user state
        setUser({ 
          accessToken: token,
          name: userInfo.name,     // 例如: "Liao Yu-Chuan" 或 "阿保老師"
          email: userInfo.email,   // 完整信箱
          picture: userInfo.picture // 大頭貼網址
        });
      } catch (err) {
        console.error("取得使用者資訊失敗", err);
        // 如果抓取失敗，至少保留 token 以維持系統運作
        setUser({ accessToken: tokenResponse.access_token });
      }
    },
    // ✅ 新增 profile 與 email 權限，以利抓取使用者資訊
    scope: 'https://www.googleapis.com/auth/drive.file profile email',
    onError: () => alert('登入失敗，請稍後再試'),
  });

  const logout = () => setUser(null);

  // 🌟 5. 新增：攔截網址參數 (學生掃碼模式)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('shareId');
    
    if (code) {
      console.log("📥 偵測到學生派送模式，代碼：", code);
      setShareId(code);
      // 🚀 神奇魔法：如果偵測到派送碼，自動切換到「報讀助理」APP
      setCurrentAppId('reader'); 
    }
  }, [setCurrentAppId]);

  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;
  const buttonPositionClass = launcherPosition === 'left' ? 'left-4' : 'right-4';
  const badgePositionClass = launcherPosition === 'left' ? 'left-20' : 'right-20'; // 避免跟 Grid 按鈕重疊

  return (
    <div className={`relative w-full h-full ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      {/* 啟動器按鈕 */}
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className={`fixed bottom-4 ${buttonPositionClass} z-[90] p-3 bg-black/5 dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm shadow-sm hover:shadow-xl`}
      >
        <Grid size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />
      </button>

      <div className="w-full h-full">
         <Suspense fallback={<LoadingScreen />}>
            <CurrentComponent 
                theme={theme} 
                cycleTheme={cycleTheme} 
                user={user}
                setUser={setUser}
				login={login}
                shareId={shareId}
                setShareId={setShareId}
            />
         </Suspense>
      </div>

      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
		user={user}
        login={login}
        logout={logout}
		onOpenPatchNotes={() => setShowHistoryNotes(true)}
      />

      {/* 🌟 兩種模式的 PatchNotesModal */}
      {/* 1. 自動彈出 (只看最新) */}
      <PatchNotesModal 
		  isOpen={showLatestNotes} 
		  onClose={() => {
			setShowLatestNotes(false);
			// 🌟 關鍵修正：關閉時，順便紀錄「已讀」的版本號
			localStorage.setItem('last_seen_version', APP_VERSION);
		  }} 
		  mode="latest" 
		/>

      {/* 2. 手動點開 (看歷史) */}
      <PatchNotesModal 
        isOpen={showHistoryNotes} 
        onClose={() => setShowHistoryNotes(false)} 
        mode="history" 
      />

    </div>
  );
};

const App = () => (
  <OSProvider>
    <ClassroomProvider>
      <ModalProvider>
        <ThemeProvider>
           <ClassroomOS />
        </ThemeProvider>
      </ModalProvider>
    </ClassroomProvider>
  </OSProvider>
);

export default App;