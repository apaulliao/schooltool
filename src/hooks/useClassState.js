import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAllItems, 
  saveItem, 
  deleteItem, 
  STORES, 
  migrateDataIfNeeded 
} from '../utils/idbService'; 

// 🌟 [修復] 補回遺失的常數定義
const MAX_HISTORY = 20; // 歷史紀錄最大步數
const CLASS_ID_KEY = 'schooltool_current_class_id';

// 🌟 [修復] 補回預設班級資料 (防止資料庫為空時崩潰)
const DEFAULT_CLASS = {
  id: 'default_class',
  name: '範例班級',
  students: [
    { id: 's1', number: '01', name: '王小明', gender: 'M', group: '1', locked: false },
    { id: 's2', number: '02', name: '陳小美', gender: 'F', group: '1', locked: false },
    { id: 's3', number: '03', name: '李小倫', gender: 'M', group: '2', locked: false },
    { id: 's4', number: '04', name: '張小瑜', gender: 'M', group: '2', locked: false },
  ],
  layout: { rows: 6, cols: 5, doorSide: 'right', seats: {}, voidSeats: [] },
  groupScores: {}, 
  scoreLogs: [], 
  attendanceRecords: {},
  behaviors: [
    { id: 'b1', icon: '👍', label: '發表意見', score: 1, type: 'positive' },
    { id: 'b2', icon: '🤝', label: '幫助同學', score: 1, type: 'positive' },
    { id: 'b3', icon: '🤫', label: '秩序良好', score: 1, type: 'positive' },
    { id: 'b4', icon: '💤', label: '上課睡覺', score: -1, type: 'negative' },
    { id: 'b5', icon: '🗣️', label: '干擾秩序', score: -1, type: 'negative' },
  ]
};

export const useClassState = () => {
    // 1. 狀態初始化
    const [classes, setClasses] = useState([DEFAULT_CLASS]); // 預設值防止 undefined
    const [currentClassId, setCurrentClassId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 歷史紀錄狀態 (Undo/Redo)
    const [historyState, setHistoryState] = useState({
        history: [],
        index: -1
    });

    // 2. 初始化：執行遷移與讀取 IDB
    useEffect(() => {
        const init = async () => {
            await migrateDataIfNeeded(); 
            const dbClasses = await getAllItems(STORES.CLASSES);
            
            if (dbClasses.length > 0) {
                setClasses(dbClasses);
                // 初始化歷史紀錄
                setHistoryState({
                    history: [{ classes: dbClasses, currentClassId: dbClasses[0].id }],
                    index: 0
                });
            } else {
                setClasses([DEFAULT_CLASS]);
                setHistoryState({
                    history: [{ classes: [DEFAULT_CLASS], currentClassId: DEFAULT_CLASS.id }],
                    index: 0
                });
            }
            
            const savedId = localStorage.getItem(CLASS_ID_KEY);
            setCurrentClassId(savedId || dbClasses[0]?.id || DEFAULT_CLASS.id);
            
            setIsLoading(false);
        };
        init();
    }, []);

    // 取得當前班級物件 (Memory Operation)
    const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

    // 3. 延遲寫入 IDB (Debounced Save)
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (isLoading || classes.length === 0) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(async () => {
            // 將最新的 classes 寫入 IndexedDB
            for (const cls of classes) {
                await saveItem(STORES.CLASSES, cls);
            }
        }, 1000); 

        return () => clearTimeout(saveTimeoutRef.current);
    }, [classes, isLoading]);

    // 記憶選擇的班級 ID
    useEffect(() => {
        if (currentClassId) localStorage.setItem(CLASS_ID_KEY, currentClassId);
    }, [currentClassId]);

    // 4. 狀態更新核心邏輯 (含歷史紀錄)
    const updateState = (newClasses, newCurrentId) => {
        setClasses(newClasses);
        if (newCurrentId) setCurrentClassId(newCurrentId);
        
        const targetId = newCurrentId || currentClassId;

        // 更新歷史紀錄堆疊
        const newHistory = historyState.history.slice(0, historyState.index + 1);
        newHistory.push({ classes: newClasses, currentClassId: targetId });
        
        // 🌟 [修復] 使用 MAX_HISTORY 限制堆疊大小
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        
        setHistoryState({
            history: newHistory,
            index: newHistory.length - 1
        });
    };

    const updateClass = useCallback((updatedClass) => {
        const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
        updateState(newClasses, currentClassId);
    }, [classes, currentClassId, historyState]); // 加入 historyState 依賴

    // 5. Undo / Redo 邏輯
    const undo = useCallback(() => {
        const { history, index } = historyState;
        if (index > 0) {
            const prevIndex = index - 1;
            const prevState = history[prevIndex];
            
            if (prevState) {
                setClasses(prevState.classes);
                setCurrentClassId(prevState.currentClassId);
                setHistoryState(prev => ({ ...prev, index: prevIndex }));
            }
        }
    }, [historyState]);

    const redo = useCallback(() => {
        const { history, index } = historyState;
        if (index < history.length - 1) {
            const nextIndex = index + 1;
            const nextState = history[nextIndex];
            
            if (nextState) {
                setClasses(nextState.classes);
                setCurrentClassId(nextState.currentClassId);
                setHistoryState(prev => ({ ...prev, index: nextIndex }));
            }
        }
    }, [historyState]);

    // 6. CRUD 輔助功能
    const addClass = (name) => {
        const newClass = { 
            ...DEFAULT_CLASS, 
            id: `c_${Date.now()}`, 
            name: name.trim() || '新班級',
            students: [],
            scoreLogs: [] 
        };
        const newClasses = [...classes, newClass];
        updateState(newClasses, newClass.id);
    };

    const deleteClass = async () => {
        if (classes.length <= 1) return alert("至少需保留一個班級");
        
        const targetId = currentClass.id;
        const newClasses = classes.filter(c => c.id !== targetId);
        const nextClassId = newClasses[0]?.id;
        
        // 從 IDB 物理刪除
        await deleteItem(STORES.CLASSES, targetId);
        
        updateState(newClasses, nextClassId);
    };

    return {
        classes, 
        currentClass, 
        currentClassId, 
        setCurrentClassId,
        updateClass,
        addClass, 
        deleteClass,
        undo, 
        redo,
        canUndo: historyState.index > 0,
        canRedo: historyState.index < historyState.history.length - 1,
        isLoading
    };
};