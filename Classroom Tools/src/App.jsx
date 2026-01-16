import React, { useState } from 'react';
import { 
  Monitor, Trophy, Layout, Users, Grid, Plus, Minus
} from 'lucide-react';

// 引入原本的電子看板檔案
import ClassroomDashboardV2 from './ClassroomDashboardV2';

// ==========================================
// 新功能：小組計分板 (Scoreboard App)
// ==========================================
const ScoreboardApp = () => {
  const [scores, setScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  
  const updateScore = (group, delta) => {
    setScores(prev => ({ ...prev, [group]: Math.max(0, prev[group] + delta) }));
  };

  return (
    <div className="w-full h-full bg-slate-100 p-8 flex flex-col items-center overflow-auto">
      <div className="max-w-6xl w-full">
        <h2 className="text-4xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <Trophy className="text-yellow-500" size={40} /> 小組計分板
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(group => (
            <div key={group} className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center border border-slate-200">
               <div className="text-2xl font-bold text-slate-500 mb-2">第 {group} 組</div>
               <div className="flex-1 flex items-center justify-center my-4">
                  <span className={`text-7xl font-mono font-bold ${scores[group] > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                    {scores[group]}
                  </span>
               </div>
               <div className="flex gap-2 w-full">
                 <button onClick={() => updateScore(group, -1)} className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold text-xl transition-colors flex items-center justify-center"><Minus size={24}/></button>
                 <button onClick={() => updateScore(group, 1)} className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 font-bold text-xl transition-colors flex items-center justify-center"><Plus size={24}/></button>
                 <button onClick={() => updateScore(group, 5)} className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-bold text-lg transition-colors">+5</button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 系統架構設定
// ==========================================

const APPS = [
  { id: 'dashboard', name: '電子看板', icon: Monitor, color: 'bg-blue-500', component: ClassroomDashboardV2 },
  { id: 'scoreboard', name: '小組計分', icon: Trophy, color: 'bg-yellow-500', component: ScoreboardApp },
  { id: 'manage', name: '班級管理', icon: Users, color: 'bg-purple-500', component: () => <div className="flex items-center justify-center h-full text-2xl text-slate-400 font-bold">🚧 功能開發中 (班級名單、座位表)</div> },
];

const AppLauncher = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white/80 backdrop-blur-md p-12 rounded-[3rem] shadow-2xl max-w-4xl w-full mx-4 border border-white/50" onClick={e => e.stopPropagation()}>
         <h2 className="text-3xl font-bold text-slate-700 mb-8 flex items-center gap-3">
           <Layout className="text-indigo-600" /> 應用程式
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
           {APPS.map(app => (
             <button 
               key={app.id} 
               onClick={() => { onSelect(app.id); onClose(); }}
               className="group flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95"
             >
               <div className={`w-32 h-32 rounded-[2rem] shadow-lg flex items-center justify-center text-white text-5xl transition-shadow group-hover:shadow-2xl ${app.color}`}>
                 <app.icon size={64} />
               </div>
               <span className="text-lg font-bold text-slate-600 group-hover:text-slate-800">{app.name}</span>
             </button>
           ))}
         </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentAppId, setCurrentAppId] = useState('dashboard');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

  // 根據 ID 決定要渲染哪一個元件
  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;

  return (
    <div className="relative w-full h-screen bg-slate-200 overflow-hidden">
      {/* 隱藏式系統選單按鈕 (左上角) */}
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className="fixed top-4 left-4 z-[90] p-3 bg-black/5 hover:bg-black/80 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm"
        title="切換應用程式"
      >
        <Grid size={24} className="text-slate-400 group-hover:text-white" />
      </button>

      {/* 應用程式容器 */}
      <div className="w-full h-full">
         <CurrentComponent />
      </div>

      {/* 啟動器 Modal */}
      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        onSelect={setCurrentAppId} 
      />
    </div>
  );
};

export default App;
