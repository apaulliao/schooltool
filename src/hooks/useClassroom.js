// src/hooks/useClassroom.js
import { useState, useCallback } from 'react'; // 引入 useCallback
import { useClassState } from './useClassState';
import { useSeating } from './useSeating';
import { useScoring } from './useScoring';

export const useClassroom = () => {
  // 1. 核心狀態 (State & Persistence)
  const classState = useClassState();
  const { currentClass, updateClass, setCurrentClassId } = classState;

  // 2. 座位與佈局邏輯 (Seating Logic)
  const seating = useSeating(currentClass, updateClass);

  // 3. 評分與反饋邏輯 (Scoring & Feedback)
  const scoring = useScoring(currentClass, updateClass);

  // 4. 其他 UI 狀態 (UI State)
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [groupBoardMode, setGroupBoardMode] = useState('entity');

  // 5. 雜項功能 (Misc)
  const updateAttendance = useCallback((date, statusMap) => {
      if (!currentClass) return;
      
      const newRecords = { 
        ...(currentClass.attendanceRecords || {}), 
        [date]: statusMap 
      };
      
      // 直接呼叫來自 useClassState 的 updateClass
      updateClass({ 
        ...currentClass, 
        attendanceRecords: newRecords 
      });
  }, [currentClass, updateClass]);
  
  const handleSelectClass = useCallback((id) => {
      setCurrentClassId(id);
  }, [setCurrentClassId]);
  
  const updateStudent = useCallback((updatedStudent) => {
    if (!currentClass) return;

    // 商業邏輯：更新陣列中的特定物件
    const newStudents = currentClass.students.map(s => 
      s.id === updatedStudent.id ? updatedStudent : s
    );

    // 寫回核心狀態
    updateClass({ ...currentClass, students: newStudents });
  }, [currentClass, updateClass]);  
  
  const updateStudents = useCallback((newStudents) => {
      updateClass({...currentClass, students: newStudents});
  }, [currentClass, updateClass]);

  // 組裝並回傳所有介面 (維持原 API 結構)
  return {
    // State
    ...classState,

    // Seating
    ...seating,

    // Scoring & Feedback
    ...scoring,

    // UI Misc
    hoveredGroup, setHoveredGroup,
    groupBoardMode, setGroupBoardMode,

    // Helpers
	setCurrentClass: handleSelectClass,
    updateAttendance,
    updateStudents, updateStudent,
  };
};