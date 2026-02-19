/**
 * 輔助函式：將分組後的二維陣列攤平並寫回學生物件
 */
const flattenAndAssign = (groups, allStudents) => {
    const groupMap = {};
    groups.forEach((gList, idx) => {
        const groupId = (idx + 1).toString();
        gList.forEach(s => {
            groupMap[s.id] = groupId;
        });
    });

    // 回傳新的學生陣列（保持原本順序，但更新 group 屬性）
    return allStudents.map(s => ({
        ...s,
        group: groupMap[s.id] !== undefined ? groupMap[s.id] : ''
    }));
};

/**
 * 純隨機分配
 */
export const distributeRandom = (students, groupCount) => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    return shuffled.map((s, i) => ({
        ...s,
        group: ((i % groupCount) + 1).toString()
    }));
};

/**
 * 性別平均分配 (S型/折返跑發牌)
 */
export const distributeGenderBalanced = (students, groupCount) => {
    const boys = students.filter(s => s.gender === 'M').sort(() => Math.random() - 0.5);
    const girls = students.filter(s => s.gender === 'F').sort(() => Math.random() - 0.5);
    const others = students.filter(s => s.gender !== 'M' && s.gender !== 'F').sort(() => Math.random() - 0.5);
    
    const groups = Array.from({ length: groupCount }, () => []);
    
    const distributeWithReset = (list) => {
        let currentGroup = 0; 
        let direction = 1;
        list.forEach(s => {
            groups[currentGroup].push(s);
            if (direction === 1) { 
                if (currentGroup === groupCount - 1) direction = -1; 
                else currentGroup++; 
            } else { 
                if (currentGroup === 0) direction = 1; 
                else currentGroup--; 
            }
        });
    };

    distributeWithReset(boys); 
    distributeWithReset(girls); 
    distributeWithReset(others);
    
    return flattenAndAssign(groups, students);
};

/**
 * 成績平均分配 (S型排序)
 */
export const distributeScoreBalanced = (students, groupCount) => {
    // 由高分到低分排序 (無成績視為 0)
    const sorted = [...students].sort((a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
    
    const groups = Array.from({ length: groupCount }, () => []);
    let currentGroup = 0; 
    let direction = 1;
    
    sorted.forEach((student) => {
        groups[currentGroup].push(student);
        if (direction === 1) { 
            if (currentGroup === groupCount - 1) direction = -1; 
            else currentGroup++; 
        } else { 
            if (currentGroup === 0) direction = 1; 
            else currentGroup--; 
        }
    });

    return flattenAndAssign(groups, students);
};

/**
 * 性別 + 成績 雙重平衡分配
 * 先拆分性別，各自依成績排序，再進行 S 型發牌
 */
export const distributeFullBalanced = (students, groupCount) => {
    const sortByScore = (a, b) => (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0);

    const boys = students.filter(s => s.gender === 'M').sort(sortByScore);
    const girls = students.filter(s => s.gender === 'F').sort(sortByScore);
    const others = students.filter(s => s.gender !== 'M' && s.gender !== 'F').sort(sortByScore);
    
    const groups = Array.from({ length: groupCount }, () => []);
    
    const distributeSortedList = (list, startDirection = 1) => {
        let currentGroup = startDirection === 1 ? 0 : groupCount - 1;
        let direction = startDirection;
        list.forEach(s => {
            groups[currentGroup].push(s);
            if (direction === 1) { 
                if (currentGroup === groupCount - 1) direction = -1; 
                else currentGroup++; 
            } else { 
                if (currentGroup === 0) direction = 1; 
                else currentGroup--; 
            }
        });
    };

    // 男生從第1組開始發，女生從最後1組開始發 (錯開強項)
    distributeSortedList(boys, 1); 
    distributeSortedList(girls, -1); 
    distributeSortedList(others, 1);
    
    return flattenAndAssign(groups, students);
};