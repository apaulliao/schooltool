import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { caseLogDB } from '../utils/caseLogDatabase';
import { encodeRowData, decodeRowData } from '../utils/sheetSchema';
import { 
  createCaseLogSheet, 
  appendCaseLogRow, 
  fetchCaseLogData,
  shareSheetWithParent,
  deleteCloudFile,
  updateCaseLogRow, clearCaseLogRow,
  uploadImageToDrive  
} from '../../../utils/googleDriveService';

// 🌟 1. 引入剛剛建立好的 AuthContext
import { useAuth } from '../../../context/AuthContext'; 

const CaseLogContext = createContext(null);

// 🌟 2. 這裡只留下 children 與 setAlertDialog (移除 user 與 login)
export const CaseLogProvider = ({ children, setAlertDialog }) => {
  // 🌟 3. 改從 useAuth() 取得登入狀態與方法
  const { user, login } = useAuth(); 

  // --- 核心狀態 (State) ---
  const [students, setStudents] = useState([]); 
  const [activeStudentId, setActiveStudentId] = useState(null); 
  const [activeTemplate, setActiveTemplate] = useState([]); 
  const [logs, setLogs] = useState([]); 
  
  // --- 系統狀態 (UI Status) ---
  const [isLoading, setIsLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [error, setError] = useState(null);

  // 取得 Google Access Token
  const getAuthToken = useCallback(() => {
    if (!user || !user.accessToken) {
      throw new Error('未登入');
    }
    return user.accessToken;
  }, [user]);
  
  // 🌟 1. 新增：將日誌儲存為本地草稿 (不上傳雲端)
  const saveDraft = useCallback(async (logData, existingDraftId = null) => {
    const activeStudent = students.find(s => s.id === activeStudentId);
    if (!activeStudent) return;

    const draftId = existingDraftId || `draft_${Date.now()}`;
    const draftLog = {
      ...logData, // 包含 content, privateNote, attachments
      id: draftId,
      studentId: activeStudentId,
      template: activeTemplate,
      timestamp: new Date().toISOString(),
      date: logData.date || new Date().toISOString().split('T')[0],
      author: user?.profileObj?.name || '目前登入老師',
      isDraft: true // 🌟 關鍵標記：這是一篇草稿
    };

    try {
      await caseLogDB.saveLog(draftLog);
      setLogs(prev => {
        const filtered = prev.filter(l => l.id !== draftId);
        return [draftLog, ...filtered]; // 實務上可再加 .sort() 排序
      });
      return draftId; // 回傳 ID 以便前端切換選取狀態
    } catch (err) {
      console.error('儲存草稿失敗', err);
    }
  }, [activeStudentId, students, activeTemplate, user]);

  // 統一的錯誤處理與重新登入邏輯
  const handleError = useCallback((err, defaultMessage) => {
    console.error('[CaseLogContext]', err);
    if (err.message === 'TokenExpired' || err.message === '未登入') {
      if (setAlertDialog) {
        setAlertDialog({
          isOpen: true,
          title: '登入安全時效已過',
          message: '為保護您的雲端資料安全，Google 登入憑證已過期或尚未登入。請點擊下方按鈕重新登入。',
          type: 'confirm',
          variant: 'warning',
          confirmText: '重新登入',
          onConfirm: () => {
            setAlertDialog(prev => ({ ...prev, isOpen: false }));
            setTimeout(() => {
                if (login) login();
            }, 100);
          }
        });
      }
      setError('請重新登入 Google 帳號。');
    } else {
      setError(defaultMessage);
    }
  }, [login, setAlertDialog]);

  // ... (保留原本的 useEffect, createStudentProfile, addLogEntry 等後續所有邏輯) ...

  // 1. 系統初始化：優先從 IndexedDB 載入學生清單
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        const cachedStudents = await caseLogDB.getStudents();
        if (cachedStudents && cachedStudents.length > 0) {
          setStudents(cachedStudents);
        }
      } catch (err) {
        console.error('[CaseLogContext] 初始化快取失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  // 2. 切換學生時的副作用：載入專屬模板與日誌
  useEffect(() => {
    if (!activeStudentId) {
      setLogs([]);
      setActiveTemplate([]);
      return;
    }

    const loadStudentData = async () => {
      const activeStudent = students.find(s => s.id === activeStudentId);
      if (!activeStudent || !activeStudent.sheetId) return;

      try {
        setIsSyncing(true);
        setError(null);

        // Step 1: 讀取本地 IndexedDB 快取
        const cachedTemplate = await caseLogDB.getTemplate(activeStudentId);
        if (cachedTemplate) setActiveTemplate(cachedTemplate);

        const cachedLogs = await caseLogDB.getLogsByStudent(activeStudentId);
        if (cachedLogs && cachedLogs.length > 0) {
          // 🌟 保留去重邏輯：過濾掉快取中重複的日誌
          const uniqueCachedLogs = Array.from(new Map(cachedLogs.map(item => [item.timestamp, item])).values());
          setLogs(uniqueCachedLogs);
        }
		const localDrafts = cachedLogs ? cachedLogs.filter(log => log.isDraft) : [];

        // Step 2: 雲端同步 (若未登入則跳過雲端同步，僅顯示本地快取)
        if (!user || !user.accessToken) return;
        
        const token = getAuthToken();
        const rawSheetData = await fetchCaseLogData(token, activeStudent.sheetId);
        
        const parsedLogs = rawSheetData.map((row, index) => {
          if (!row || row.length === 0) return null; // 過濾掉被 clear 清空的空白列
          
          const uniqueId = `log_${activeStudentId}_${index}_${row[0]}`;
          const decoded = decodeRowData(row, uniqueId);
          decoded.sheetRowIndex = index + 2; // 🌟 紀錄真實列數 (A2 是第 2 列，所以 index 0 + 2 = 2)
          return decoded;
        }).filter(Boolean).reverse();
		
		const uniqueParsedLogs = Array.from(new Map(parsedLogs.map(item => [item.timestamp, item])).values());
        setLogs(parsedLogs);
        await caseLogDB.syncLogsForStudent(activeStudentId, parsedLogs);
		// 🌟 防護 2：將雲端日誌與剛剛提取的本地草稿合併
        const combinedLogs = [...localDrafts, ...parsedLogs];

        setLogs(combinedLogs);
        // 同步回本地 IndexedDB 時，也寫入合併後的完整陣列
        await caseLogDB.syncLogsForStudent(activeStudentId, combinedLogs);

      } catch (err) {
        // 🌟 加入除錯訊息，確認捕捉到的錯誤內容
        console.error('[Debug 5] loadStudentData 捕捉到錯誤:', err.message);
        
        const errMsg = err.message || '';
        if (errMsg.includes('FILE_MISSING_OR_TRASHED') || errMsg.includes('404')) {
          
          // 🌟 檢查 setAlertDialog 的型別
          console.log('[Debug 6] 準備觸發彈窗。setAlertDialog 型別為:', typeof setAlertDialog);
          
          if (setAlertDialog) {
            console.log('[Debug 7] 執行 setAlertDialog');
            setAlertDialog({
              isOpen: true,
              title: '雲端檔案遺失',
              message: `在 Google Drive 中找不到 ${activeStudent.name} 的日誌檔案。可能是被手動刪除或移至垃圾桶了。\n\n是否要將此學生從系統清單中移除？`,
              type: 'confirm',
              variant: 'danger',
              confirmText: '移除本地紀錄',
              onConfirm: async () => {
                await deleteStudentProfile(activeStudentId, false);
                setAlertDialog(prev => ({ ...prev, isOpen: false }));
              }
            });
          } else {
             console.error('[Debug 8] 嚴重錯誤：setAlertDialog 未定義！');
          }
        } else {
          handleError(err, '背景同步失敗，目前顯示為離線快取資料。');
        }
      } finally {
        setIsSyncing(false);
      }
    };
    loadStudentData();
  }, [activeStudentId, students, user, getAuthToken, handleError]);

  // 新增學生檔案
  const createStudentProfile = useCallback(async (studentName) => {
    setIsSyncing(true);
    setError(null);
    try {
      const token = getAuthToken();
      const sheetId = await createCaseLogSheet(token, studentName);
      
      const newStudent = { 
        id: `student_${Date.now()}`, 
        name: studentName, 
        sheetId,
        createdAt: new Date().toISOString()
      };

      await caseLogDB.saveStudent(newStudent);
      setStudents(prev => [...prev, newStudent]);
      setActiveStudentId(newStudent.id);
      return newStudent;
    } catch (err) {
      handleError(err, '建立學生檔案失敗，請檢查權限或網路。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [getAuthToken, handleError]);

  // 寫入新日誌
  // 寫入新日誌
  const addLogEntry = useCallback(async (logData, draftIdToRemove = null) => {
    const activeStudent = students.find(s => s.id === activeStudentId);
    if (!activeStudent || !activeStudent.sheetId) return;
    
    setIsSyncing(true);
    setError(null);
    try {
      const token = getAuthToken();

      // 🌟 1. 處理附件上傳
      const processedAttachments = [];
      if (logData.attachments && logData.attachments.length > 0) {
        for (const file of logData.attachments) {
          if (file instanceof File) {
            const driveData = await uploadImageToDrive(token, file);
            processedAttachments.push(driveData);
          } else {
            processedAttachments.push(file);
          }
        }
      }
      
      const fullLogData = {
        ...logData,
        attachments: processedAttachments, // 🌟 將轉換好的圖片資料寫入
        template: activeTemplate,
        timestamp: new Date().toISOString(),
        date: logData.date || new Date().toISOString().split('T')[0],
        author: user?.profileObj?.name || '目前登入老師' 
      };

      const rowData = encodeRowData(fullLogData);
      const result = await appendCaseLogRow(token, activeStudent.sheetId, rowData);
      
      const newLog = decodeRowData(rowData, `log_${Date.now()}`);
      newLog.studentId = activeStudentId;
      newLog.attachments = processedAttachments; // 確保前端即時更新有圖片
      
      const match = result?.updates?.updatedRange?.match(/\d+/g);
      newLog.sheetRowIndex = match ? parseInt(match[match.length - 1], 10) : (logs.length + 2);
      
      await caseLogDB.saveLog(newLog);

      // 若這是一篇被發布的草稿，從本地 DB 清除它
      if (draftIdToRemove && caseLogDB.deleteLog) {
        await caseLogDB.deleteLog(draftIdToRemove).catch(() => {});
      }

      setLogs(prev => {
        const next = draftIdToRemove ? prev.filter(l => l.id !== draftIdToRemove) : prev;
        return [newLog, ...next];
      });
    } catch (err) {
      handleError(err, '日誌儲存失敗。若處於離線狀態，請稍後重試。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [activeStudentId, students, user, getAuthToken, handleError, activeTemplate]);
  
  // 更新模板
  const saveTemplate = useCallback(async (newTemplate) => {
    if (!activeStudentId) return;
    setIsSyncing(true);
    try {
      await caseLogDB.saveTemplate(activeStudentId, newTemplate);
      setActiveTemplate(newTemplate);
    } catch (err) {
      setError('模板儲存失敗。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [activeStudentId]);
  
  // 🌟 1. 新增：刪除學生檔案 (支援連同雲端一起刪除)
  const deleteStudentProfile = useCallback(async (studentId, deleteFromCloud = false) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setIsSyncing(true);
    try {
      // 若老師選擇連同雲端一併刪除
      if (deleteFromCloud && user && user.accessToken && student.sheetId) {
        await deleteCloudFile(user.accessToken, student.sheetId);
      }
      
      // 清除本地 DB 快取
      await caseLogDB.deleteStudent(studentId);
      
      // 更新 React State
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (activeStudentId === studentId) setActiveStudentId(null);
    } catch (err) {
      handleError(err, '刪除學生檔案失敗');
    } finally {
      setIsSyncing(false);
    }
  }, [students, activeStudentId, user, handleError]);
  
  // 更新舊日誌
  const updateLogEntry = useCallback(async (logId, updatedData) => {
    const activeStudent = students.find(s => s.id === activeStudentId);
    const targetLog = logs.find(l => l.id === logId);
    if (!activeStudent || !targetLog || !targetLog.sheetRowIndex) return;

    setIsSyncing(true);
    try {
      const token = getAuthToken();

      // 🌟 1. 處理被刪除的附件 (比對舊有圖片是否已從表單中被拔除)
      const oldAttachments = targetLog.attachments || [];
      const newAttachments = updatedData.attachments || [];
      const removedAttachments = oldAttachments.filter(
        oldAtt => !newAttachments.some(newAtt => newAtt.driveId === oldAtt.driveId)
      );

      for (const att of removedAttachments) {
        if (att.driveId) {
          try {
            await deleteCloudFile(token, att.driveId);
          } catch (e) {
            console.error(`刪除舊圖片 ${att.driveId} 失敗`, e);
          }
        }
      }

      // 🌟 2. 處理新上傳的附件
      const processedAttachments = [];
      for (const file of newAttachments) {
        if (file instanceof File) {
          const driveData = await uploadImageToDrive(token, file);
          processedAttachments.push(driveData);
        } else {
          processedAttachments.push(file);
        }
      }

      const fullLogData = {
        ...targetLog, 
        ...updatedData, 
        attachments: processedAttachments, // 🌟 覆寫為最新的附件清單
        template: activeTemplate,
        author: targetLog.author.includes('(已編輯)') ? targetLog.author : `${targetLog.author} (已編輯)` 
      };
      const rowData = encodeRowData(fullLogData);

      await updateCaseLogRow(token, activeStudent.sheetId, targetLog.sheetRowIndex, rowData);
      
      const updatedLog = { ...fullLogData };
      await caseLogDB.saveLog(updatedLog);
      setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
    } catch (err) {
      handleError(err, '更新日誌失敗。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [activeStudentId, students, logs, activeTemplate, getAuthToken, handleError]);

  // 刪除日誌
  const deleteSingleLog = useCallback(async (logId) => {
    const activeStudent = students.find(s => s.id === activeStudentId);
    const targetLog = logs.find(l => l.id === logId);
    if (!activeStudent || !targetLog) return;
    if (!targetLog.isDraft && !targetLog.sheetRowIndex) return;

    setIsSyncing(true);
    try {
      if (targetLog.isDraft) {
        if (caseLogDB.deleteLog) await caseLogDB.deleteLog(logId);
        setLogs(prev => prev.filter(l => l.id !== logId));
        return; 
      }

      const token = getAuthToken();

      // 🌟 新增：在刪除文字前，先將雲端硬碟中的圖片實體刪除
      if (targetLog.attachments && targetLog.attachments.length > 0) {
        for (const att of targetLog.attachments) {
          if (att.driveId) {
            try {
              await deleteCloudFile(token, att.driveId);
            } catch (imgErr) {
              console.error(`圖片 ${att.driveId} 刪除失敗，略過此檔案`, imgErr);
            }
          }
        }
      }

      await clearCaseLogRow(token, activeStudent.sheetId, targetLog.sheetRowIndex);
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      handleError(err, '刪除日誌失敗。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [activeStudentId, students, logs, getAuthToken, handleError]);  
  
  // 產生家長檢視連結
const generateParentLink = useCallback(async () => {
    const activeStudent = students.find(s => s.id === activeStudentId);
    if (!activeStudent || !activeStudent.sheetId) throw new Error('無效的學生檔案');
    
    setIsSyncing(true);
    try {
      const token = getAuthToken();
      await shareSheetWithParent(token, activeStudent.sheetId);
      
      // 🌟 修正：組合帶有正確子路徑的完整網址
      const basePath = import.meta.env.BASE_URL || '/';
      // 將 origin 與 base 組合，並確保結尾沒有多餘的斜線避免變成 //parent/view
      const originWithBase = `${window.location.origin}${basePath}`.replace(/\/$/, '');
      
      const fakeToken = btoa(`${activeStudent.sheetId}_${Date.now()}`);
      
      return `${originWithBase}/parent/view?id=${activeStudent.sheetId}&token=${fakeToken}`;
    } catch (err) {
      handleError(err, '產生家長連結失敗。');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [activeStudentId, students, getAuthToken, handleError]);

  const value = {
    students,
    activeStudent: students.find(s => s.id === activeStudentId) || null,
    activeStudentId,
    activeTemplate,
    logs,
    isLoading,
    isSyncing,
    error,
    setActiveStudentId,
    createStudentProfile,
    addLogEntry,
    saveTemplate,
    generateParentLink,
    clearError: () => setError(null),
	deleteStudentProfile,
	updateLogEntry,
	saveDraft,
	deleteSingleLog
  };

  return (
    <CaseLogContext.Provider value={value}>
      {children}
    </CaseLogContext.Provider>
  );
};

export const useCaseLog = () => {
  const context = useContext(CaseLogContext);
  if (!context) {
    throw new Error('useCaseLog must be used within a CaseLogProvider');
  }
  return context;
};