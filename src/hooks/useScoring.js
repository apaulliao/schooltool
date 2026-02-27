// src/hooks/useScoring.js
import { useState, useEffect } from 'react';
import { useAudio } from './useAudio';
import { ATTENDANCE_STATUS } from '../utils/constants';

const MAX_LOGS = 100;
const MILESTONE_STEP = 10; 

export const useScoring = (currentClass, updateClass) => {
    const { playAudio } = useAudio();
    const [feedbacks, setFeedbacks] = useState([]);

    const scoreStudent = (targetId, behavior, mode) => {
        // ... (前面的邏輯保持不變：時間戳記、分數計算、名單過濾、Log 紀錄、資料更新) ...
        const timestamp = Date.now();
        const scoreValue = Number(behavior.value !== undefined ? behavior.value : (behavior.score || 0));
        const todayDate = new Date().toLocaleDateString('en-CA');
        const todayAttendance = currentClass.attendanceRecords?.[todayDate] || {};

        let targetStudents = [];
        if (mode === 'individual') targetStudents = currentClass.students.filter(s => s.id === targetId);
        else if (mode === 'class') targetStudents = currentClass.students;
        else if (mode === 'group_members') targetStudents = currentClass.students.filter(s => s.group === targetId);
        else if (mode === 'group') targetStudents = []; 

        let validStudents = targetStudents;
        if (mode === 'class' || mode === 'group_members') {
            validStudents = targetStudents.filter(s => {
                const statusKey = todayAttendance[s.id] || 'present';
                if (ATTENDANCE_STATUS && ATTENDANCE_STATUS[statusKey]) return ATTENDANCE_STATUS[statusKey].isPresent;
                return statusKey !== 'absent' && statusKey !== 'personal' && statusKey !== 'leave' && statusKey !== 'sick';
            });
        }

        let targetName = '未知目標';
        if (mode === 'class') targetName = '全班同學';
        else if (mode === 'group') targetName = `第 ${targetId} 組 (小組)`;
        else if (mode === 'group_members') targetName = `第 ${targetId} 組 (全員)`;
        else if (mode === 'individual') targetName = targetStudents[0]?.name || '未知';

        const behaviorLabel = behavior.label || (behavior.isQuick ? (scoreValue > 0 ? '快速加分' : '快速扣分') : '評分');
        const effectType = behavior.type || (scoreValue > 0 ? 'positive' : scoreValue < 0 ? 'negative' : 'neutral');

        const newLog = {
            id: `log_${timestamp}_${Math.random()}`,
            targetId: targetId === 'all' ? 'all' : targetId,
            targetType: mode,
            targetName,
            behaviorId: behavior.id || 'quick',
            behaviorLabel,
            score: scoreValue,
            value: scoreValue,
            timestamp,
            effectType,
            count: validStudents.length,
            validStudentIds: validStudents.map(s => s.id)
        };

        let updates = {};
        let milestoneEvents = []; 

        if (mode === 'group') {
            const currentGroupScores = currentClass.groupScores || {};
            const oldScore = currentGroupScores[targetId] || 0;
            const newScore = oldScore + scoreValue;
            updates.groupScores = { ...currentGroupScores, [targetId]: newScore };

            if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                milestoneEvents.push({ type: 'group', id: targetId, score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP });
            }
        } else {
            const validIds = new Set(validStudents.map(s => s.id));
            updates.students = currentClass.students.map(s => {
                if (validIds.has(s.id)) {
                    const oldScore = s.score || 0;
                    const newScore = oldScore + scoreValue;
                    if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                        milestoneEvents.push({ type: 'student', id: s.id, score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP });
                    }
                    return { ...s, score: newScore };
                }
                return s;
            });
        }

        const currentLogs = currentClass.scoreLogs || [];
        newLog.milestones = milestoneEvents; 
        const updatedLogs = [...currentLogs, newLog].slice(-MAX_LOGS);
        updateClass({ ...currentClass, ...updates, scoreLogs: updatedLogs });

        // --- 視覺與音效 ---
        if (scoreValue > 0) {
            if (mode === 'class') playAudio('coin_class');
            else if (mode === 'group' || mode === 'group_members') playAudio('coin_group');
            else playAudio('coin');
        } else if (scoreValue < 0) {
            playAudio('negative'); 
        }

        const newFeedbacks = [];
        
        // ★ 修改重點：小組加分現在也顯示在「螢幕正中央」，並調整文字標籤
        if (mode === 'group' || mode === 'group_members') {
            newFeedbacks.push({
                id: `fb_${timestamp}_GROUP`, 
                x: window.innerWidth / 2, // 改為正中央
                y: window.innerHeight / 2, 
                value: scoreValue, 
                label: `第 ${targetId} 組加分`, // 更明確的標籤
                type: 'group' // 這裡保留 type: 'group'，我們會在 ScoreFeedback 裡把它升級
            });
        } else if (mode === 'class') {
            newFeedbacks.push({
                id: `fb_${timestamp}_CLASS`, 
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2,
                value: scoreValue, 
                label: '全班加分', 
                type: 'class'
            });
        } 
        
        // 個人加分 (保持原樣，顯示在卡片上)
        if (mode !== 'group' && mode !== 'class') {
            (validStudents || []).forEach((s, index) => {
                // 🌟 [修復 2-B] 安全的 DOM 讀取
                const el = document.getElementById(`student-card-${s.id}`);
                
                // 預設位置：螢幕正中央 (如果找不到元素，就在中間跳出，至少讓老師知道有加分)
                let rect = { 
                    left: window.innerWidth / 2 - 30, // 稍微修正置中偏移
                    top: window.innerHeight / 2, 
                    width: 60 
                };
                
                if (el) {
                    rect = el.getBoundingClientRect();
                } else {
                    console.warn(`找不到學生卡片 DOM: student-card-${s.id}，將顯示於中央。請檢查 StudentCard 是否有設定 id 屬性。`);
                }

                newFeedbacks.push({
                    id: `fb_${timestamp}_${s.id}_${Math.random()}`,
                    x: rect.left + rect.width / 2 - 20, // 確保在卡片中央
                    y: rect.top,
                    value: scoreValue,
                    delay: index * 10,
                    type: 'student'
                });
            });
        }

        // 里程碑 (保持原樣，但 ScoreFeedback 會負責加強特效)
        milestoneEvents.forEach(event => {
            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;
            if (event.type === 'student') {
                const el = document.getElementById(`student-card-${event.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    x = rect.left + rect.width / 2;
                    y = rect.top + rect.height / 2;
                }
            } else if (event.type === 'group') {
                // 小組里程碑也改到中間比較有氣勢
                x = window.innerWidth / 2;
                y = window.innerHeight / 2;
            }
            newFeedbacks.push({
                id: `milestone_${timestamp}_${event.id}`,
                x, y, value: event.score, label: '里程碑達成！', type: 'milestone', milestoneType: event.type
            });
        });

        if (newFeedbacks.length > 0) {
            setFeedbacks(prev => [...prev, ...newFeedbacks]);
            setTimeout(() => {
                const idsToRemove = new Set(newFeedbacks.map(f => f.id));
                setFeedbacks(prev => prev.filter(f => !idsToRemove.has(f.id)));
            }, 3000);
        }

        if (milestoneEvents.length > 0) {
            setTimeout(() => { playAudio('applause'); }, 400); 
        }
    };

    const resetScores = (type) => { /* ...保持不變... */ 
        let updates = {};
        if (type === 'student') {
            updates.students = currentClass.students.map(s => ({ ...s, score: 0 }));
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'student');
        } else if (type === 'group') {
            updates.groupScores = {};
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'group_entity');
        }
        updateClass({ ...currentClass, ...updates });
    };
    const updateBehaviors = (newBehaviors) => updateClass({ ...currentClass, behaviors: newBehaviors });
    const clearScoreLogs = () => updateClass({ ...currentClass, scoreLogs: [] });

    return { scoreStudent, resetScores, updateBehaviors, clearScoreLogs, feedbacks };
};