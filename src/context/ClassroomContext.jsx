import React, { createContext, useContext } from 'react';
import { useClassroom } from '../hooks/useClassroom';

// 建立 Context
const ClassroomContext = createContext(null);

// 建立 Provider
export const ClassroomProvider = ({ children }) => {
  // 使用您已經寫好的 useClassroom Hook
  const classroomData = useClassroom();  

  // 🌟 新增：如果資料庫還在讀取，就顯示 Loading，不要渲染子元件
  if (classroomData.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          <p>正在讀取教室資料庫...</p>
        </div>
      </div>
    );
  }

  return (
    <ClassroomContext.Provider value={classroomData}>
      {children}
    </ClassroomContext.Provider>
  );
};

// 建立一個方便的 Hook 供子組件使用
export const useClassroomContext = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroomContext must be used within a ClassroomProvider');
  }
  return context;
};