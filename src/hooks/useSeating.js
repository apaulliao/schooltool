// src/hooks/useSeating.js
import { useState, useEffect, useCallback,useRef } from 'react'; // 1. 引入 useCallback
import { calculateShuffledSeats } from '../utils/seatAlgorithms';

const DEFAULT_TEMPLATES = [
    { id: 'tpl_standard', name: '一般教室配置', type: 'preset', description: '清空走道模式，標準直排 (6排x5列)' },
    { id: 'tpl_group', name: '小組隊形 (6組)', type: 'preset', description: '8排x7列 (含走道)，分為6個島嶼' },
    { id: 'tpl_u_shape', name: 'U型會議配置', type: 'preset', description: '6排x7列，前方中央區域留空' },
];

export const useSeating = (currentClass, updateClass) => {

const currentClassRef = useRef(currentClass);

// 每次 render 都更新 ref
useEffect(() => {
    currentClassRef.current = currentClass;
}, [currentClass]);

// toggleLock 改成讀取 Ref
const toggleLock = useCallback((studentId) => {
    const current = currentClassRef.current; // 讀取最新的
    const updatedStudents = current.students.map(s => 
        s.id === studentId ? { ...s, locked: !s.locked } : s
    );
    updateClass({ ...current, students: updatedStudents });
}, [updateClass]); // 移除 currentClass 依賴！


    const [seatMode, setSeatMode] = useState('replace');
    const [templates, setTemplates] = useState(() => {
        const saved = localStorage.getItem('schooltool_templates');
        let savedTemplates = [];
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                savedTemplates = parsed.filter(t => t.type === 'custom');
            } catch (e) { console.error(e); }
        }
        return [...DEFAULT_TEMPLATES, ...savedTemplates];
    });

    useEffect(() => {
        localStorage.setItem('schooltool_templates', JSON.stringify(templates));
    }, [templates]);

    const unseatedStudents = currentClass.students.filter(s => {
        return !Object.values(currentClass.layout.seats || {}).includes(s.id);
    });


    const toggleVoid = useCallback((row, col) => {
        const key = `${row}-${col}`;
        const voidSeats = currentClass.layout.voidSeats || [];
        const newVoidSeats = voidSeats.includes(key) ? voidSeats.filter(k => k !== key) : [...voidSeats, key];
        const newSeats = { ...currentClass.layout.seats };
        if (newSeats[key]) delete newSeats[key];
        updateClass({ ...currentClass, layout: { ...currentClass.layout, voidSeats: newVoidSeats, seats: newSeats } });
    }, [currentClass, updateClass]);

    const clearSeats = useCallback(() => {
        updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: {} } });
    }, [currentClass, updateClass]);

    const seatDrop = useCallback((studentId, row, col, sourceSeat) => {
        const newSeats = { ...currentClass.layout.seats };
        const targetKey = `${row}-${col}`;
        const targetStudentId = newSeats[targetKey];

        if (seatMode === 'swap' && targetStudentId && sourceSeat) {
            newSeats[targetKey] = studentId;
            newSeats[sourceSeat] = targetStudentId;
        } else {
            if (sourceSeat) delete newSeats[sourceSeat];
            else {
                const existingKey = Object.keys(newSeats).find(k => newSeats[k] === studentId);
                if (existingKey) delete newSeats[existingKey];
            }
            newSeats[targetKey] = studentId;
        }
        updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: newSeats } });
    }, [currentClass, updateClass, seatMode]); // 這裡要依賴 seatMode

    const sidebarDrop = useCallback((sourceSeat) => {
        if (sourceSeat) {
            const newLayout = { ...currentClass.layout };
            newLayout.seats = { ...currentClass.layout.seats };
            delete newLayout.seats[sourceSeat];
            updateClass({ ...currentClass, layout: newLayout });
        }
    }, [currentClass, updateClass]);

    const shuffleSeats = useCallback((mode) => {
        const lockedAssignments = {};
        Object.entries(currentClass.layout.seats).forEach(([key, studentId]) => {
            const student = currentClass.students.find(s => s.id === studentId);
            if (student && student.locked) lockedAssignments[key] = studentId;
        });

        const newSeats = calculateShuffledSeats(mode, currentClass.students, currentClass.layout, lockedAssignments);
        updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: newSeats } });
    }, [currentClass, updateClass]);

    const saveTemplate = useCallback((name) => {
        const newTemplate = {
            id: `tpl_${Date.now()}`, name: name, type: 'custom',
            layout: { voidSeats: currentClass.layout.voidSeats, rows: currentClass.layout.rows, cols: currentClass.layout.cols }
        };
        setTemplates(prev => [...prev, newTemplate]);
    }, [currentClass]);
    
    const deleteTemplate = useCallback((id) => setTemplates(prev => prev.filter(t => t.id !== id)), []);

    const applyTemplate = useCallback((template) => {
        let newLayout = { ...currentClass.layout };
        if (template.type === 'custom') {
            newLayout.rows = template.layout.rows;
            newLayout.cols = template.layout.cols;
            newLayout.voidSeats = template.layout.voidSeats;
        } else {
            newLayout.voidSeats = [];
            if (template.id === 'tpl_standard') { newLayout.rows = 6; newLayout.cols = 5; }
            else if (template.id === 'tpl_group') {
                newLayout.rows = 8; newLayout.cols = 7;
                for (let y = 0; y < 7; y++) { newLayout.voidSeats.push(`${y}-2`, `${y}-5`); }
                for (let x = 0; x < 8; x++) { if (x !== 2 && x !== 5) newLayout.voidSeats.push(`3-${x}`); }
            } else if (template.id === 'tpl_u_shape') {
                newLayout.rows = 6; newLayout.cols = 7;
                for (let y = 0; y <= 3; y++) { newLayout.voidSeats.push(`${y}-2`, `${y}-3`); }
            }
        }
        
        const newSeats = { ...newLayout.seats };
        Object.keys(newSeats).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            if (c >= newLayout.rows || r >= newLayout.cols || newLayout.voidSeats.includes(key)) delete newSeats[key];
        });
        newLayout.seats = newSeats;
        updateClass({ ...currentClass, layout: newLayout });
    }, [currentClass, updateClass]);
    
    const importStudentList = useCallback((newStudents) => {
        updateClass({ ...currentClass, students: newStudents, layout: { ...currentClass.layout, seats: {}, rows: 4, cols: 8, doorSide: 'right', voidSeats: [] }, scoreLogs: [] });
    }, [currentClass, updateClass]);

    return {
        seatMode, setSeatMode, templates, unseatedStudents,
        toggleLock, toggleVoid, clearSeats, seatDrop, sidebarDrop, shuffleSeats,
        saveTemplate, deleteTemplate, applyTemplate, importStudentList
    };
};