import React, { memo } from 'react';
import { DoorOpen } from 'lucide-react';
import SeatCell from './SeatCell';

const SeatGrid = memo(({ 
  layout, 
  students, 
  isTeacherView, 
  onSeatDrop, 
  onStudentClick, 
  displayMode, 
  appMode, 
  attendanceStatus, 
  onToggleVoid, 
  onToggleLock, 
  hoveredGroup 
}) => {
  if (!layout) return null;

  const { rows, cols, seats, voidSeats, doorSide } = layout;
  
  const rowIndices = Array.from({ length: cols }, (_, i) => i);
  if (isTeacherView) rowIndices.reverse();

  // 判斷門在視覺上的左邊還是右邊
  const isVisualRight = isTeacherView ? (doorSide === 'left') : (doorSide === 'right');

  // ✅ 修改重點：使用負值定位將門「拉」到父容器的 padding 區域
  // p-8 對應 -right-8 / -left-8
  // md:p-12 對應 md:-right-12 / md:-left-12
  const doorSideClass = isVisualRight 
    ? '-right-8 md:-right-12 rounded-l-xl border-l-4' // 在右側：往右推負值，圓角朝左
    : '-left-8 md:-left-12 rounded-r-xl border-r-4'; // 在左側：往左推負值，圓角朝右

  return (
    // ✅ 移除上一輪建議的 containerPadding，恢復單純的 relative 即可
    <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col transition-all duration-300">
      
      {/* 門位標示：維持 absolute，但因為上面的 class 修改，現在會貼到最邊邊 */}
      <div className={`absolute w-6 h-24 bg-amber-200 dark:bg-amber-900/80 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold text-[16px] writing-vertical ${doorSideClass} top-12 transition-colors z-10 shadow-md`}>
         
        <span className="tracking-widest">{isTeacherView ? '後門' : '前門'}</span>
      </div>
      
      <div className={`absolute w-6 h-24 bg-amber-200 dark:bg-amber-900/80 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold text-[16px] writing-vertical ${doorSideClass} bottom-12 transition-colors z-10 shadow-md`}>
        
        <span className="tracking-widest">{isTeacherView ? '前門' : '後門'}</span>
      </div>

      {/* 座位網格 (無需更動) */}
      <div className="flex-1 w-full min-h-0 grid gap-2">
        {rowIndices.map(r => (
          <div key={r} className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))` }}>
            {Array.from({ length: rows }, (_, c) => {
              const displayCol = isTeacherView ? (rows - 1 - c) : c;
              const key = `${r}-${displayCol}`;
              const student = students.find(s => s.id === seats[key]);
              
              return (
                <SeatCell 
                  key={key} 
                  row={r} 
                  col={displayCol} 
                  student={student}
                  onDrop={onSeatDrop} 
                  onDragStart={(e, id) => { 
                    e.dataTransfer.setData("studentId", id); 
                    e.dataTransfer.setData("sourceSeat", key); 
                  }}
                  onStudentClick={onStudentClick} 
                  displayMode={displayMode} 
                  mode={appMode}
                  attendanceStatus={attendanceStatus} 
                  isVoid={voidSeats?.includes(key)}
                  onToggleVoid={onToggleVoid} 
                  onToggleLock={onToggleLock} 
                  hoveredGroup={hoveredGroup}
                  layoutRows={cols}  
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

SeatGrid.displayName = 'SeatGrid';

export default SeatGrid;