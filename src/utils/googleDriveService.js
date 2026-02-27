// src/utils/googleDriveService.js
import { SHEET_HEADERS } from '../pages/CaseLog/utils/sheetSchema';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'; // 🌟 新增 Sheets API 端點

// 定義明確的名稱與路徑
const ROOT_FOLDER_NAME = '智慧教室儀表板';
const EXAM_FOLDER_NAME = '考卷派送檔';
const CASELOG_FOLDER_NAME = '個案日誌檔'; // 🌟 新增個案日誌資料夾
const BACKUP_FILE_NAME = '智慧教室儀表板設定檔.json'; 

/**
 * 輔助函式：檢查 Token 是否過期或 API 異常
 */
const checkResponse = async (res) => {
  if (res.status === 401) {
    throw new Error('TokenExpired');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`API Error: ${res.status} - ${errorData.error?.message || 'Unknown'}`);
  }
  return res;
};

/**
 * 核心：獲取或建立資料夾 (支援多層級)
 */
const getOrCreateFolder = async (token, folderName, parentId = null) => {
  let q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const res = await fetch(`${DRIVE_API}?q=${encodeURIComponent(q)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // 若資料夾不存在則建立
  const createRes = await fetch(DRIVE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    })
  });
  await checkResponse(createRes);
  const folder = await createRes.json();
  return folder.id;
};

/**
 * 輔助函式：在指定資料夾內依據檔名尋找檔案
 */
const findFileInFolder = async (token, fileName, folderId) => {
  const q = encodeURIComponent(`name='${fileName}' and '${folderId}' in parents and trashed=false`);
  const res = await fetch(`${DRIVE_API}?q=${q}&spaces=drive&fields=files(id,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
};

// ==========================================
// 模組 1：系統備份與考卷派送 (現有功能)
// ==========================================

export const syncToCloud = async (token, fileName, jsonData) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    let file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);

    if (!file) {
      const createRes = await fetch(DRIVE_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: BACKUP_FILE_NAME, 
          mimeType: 'application/json',
          parents: [rootFolderId] 
        })
      });
      await checkResponse(createRes);
      file = await createRes.json();
    }

    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    });
    await checkResponse(uploadRes);
    
    return true;
  } catch (error) {
    console.error('雲端同步失敗:', error);
    throw error;
  }
};

export const fetchFromCloud = async (token) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);
    if (!file) return null;

    const res = await fetch(`${DRIVE_API}/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(res);
    return await res.json();
  } catch (error) {
    console.error('讀取雲端備份失敗:', error);
    throw error;
  }
};

export const shareExamToCloud = async (token, examData, customFileName) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);
    
    // 🌟 1. 終極防呆命名邏輯：從各種可能的位置提取標題
    let baseName = '未命名考卷';
    if (customFileName) {
      baseName = customFileName; // 優先使用傳入的自訂檔名
    } else if (examData.packageTitle) {
      baseName = examData.packageTitle; // 其次使用 Payload 上的標題
    } else if (examData.title) {
      baseName = examData.title; // 相容舊版單一考卷
    } else if (examData.exams && examData.exams.length > 0 && examData.exams[0].title) {
      // 處理直接傳入物件但漏傳檔名的情況 (從第一份考卷提取)
      baseName = `[派送考卷]_${examData.exams[0].title}`;
    }

    // 🌟 2. 將 Date.now() 轉換為一般日期時間格式 (YYYYMMDD_HHMM)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${yyyy}${mm}${dd}_${hh}${min}`; // 產生如 20240315_0930 的字串
	
    const finalFileName = `${baseName}_${timeString}.json`;

    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: finalFileName,
        mimeType: 'application/json',
        parents: [examFolderId]
      })
    });
    await checkResponse(createRes);
    const file = await createRes.json();

    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(examData)
    });
    await checkResponse(uploadRes);

    const permRes = await fetch(`${DRIVE_API}/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    return file.id; 
  } catch (error) {
    console.error('派送考卷失敗:', error);
    throw error;
  }
};

export const downloadSharedExam = async (shareId, apiKey) => {
  try {
    const res = await fetch(`${DRIVE_API}/${shareId}?alt=media&key=${apiKey}`);
    if (!res.ok) throw new Error('無法下載考卷，可能是連結失效或權限不符');
    return await res.json();
  } catch (error) {
    console.error('下載派送考卷失敗:', error);
    throw error;
  }
};

export const getCloudBackupTime = async (token) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);
    return file ? file.modifiedTime : null;
  } catch (error) {
    if (error.message === 'TokenExpired') throw error;
    console.error('獲取備份時間失敗:', error);
    return null;
  }
};

export const listSharedExams = async (token) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);

    const q = encodeURIComponent(`'${examFolderId}' in parents and trashed=false`);
    const res = await fetch(`${DRIVE_API}?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(res);
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('獲取考卷清單失敗:', error);
    throw error;
  }
};

export const deleteCloudFile = async (token, fileId) => {
  try {
    const res = await fetch(`${DRIVE_API}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status !== 204) await checkResponse(res);
    return true;
  } catch (error) {
    console.error('刪除檔案失敗:', error);
    throw error;
  }
};

// ==========================================
// 模組 2：CaseLog 個案日誌 (新增功能)
// ==========================================

/**
 * 建立單一學生的個案日誌 (Google Sheet)
 */
export const createCaseLogSheet = async (token, studentName) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const caseLogFolderId = await getOrCreateFolder(token, CASELOG_FOLDER_NAME, rootId);

    // 1. 透過 Drive API 建立 Spreadsheet 檔案並指定資料夾
    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: `[日誌] ${studentName}`,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [caseLogFolderId]
      })
    });
    await checkResponse(createRes);
    const file = await createRes.json();
    const spreadsheetId = file.id;

    // 2. 透過 Sheets API 寫入標題列 (Headers)
    const headerRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A1:G1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [SHEET_HEADERS] })
    });
    await checkResponse(headerRes);

    // 3. 凍結第一列 (提升閱讀體驗)
    // 3.1 獲取 sheetId
    const metaRes = await fetch(`${SHEETS_API}/${spreadsheetId}?fields=sheets(properties(sheetId))`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(metaRes);
    const metaData = await metaRes.json();
    const sheetId = metaData.sheets[0].properties.sheetId;

    // 3.2 執行 batchUpdate 凍結
    await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          updateSheetProperties: {
            properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount'
          }
        }]
      })
    });

    return spreadsheetId;
  } catch (error) {
    console.error('建立學生日誌失敗:', error);
    throw error;
  }
};

/**
 * 寫入單筆日誌資料 (Append Row)
 */
export const appendCaseLogRow = async (token, spreadsheetId, rowData) => {
  try {
    const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [rowData] })
    });
    await checkResponse(res);
    return await res.json();
  } catch (error) {
    console.error('寫入日誌資料失敗:', error);
    throw error;
  }
};

/**
 * 讀取學生的所有日誌資料
 */
// src/utils/googleDriveService.js

export const fetchCaseLogData = async (token, spreadsheetId) => {
  try {
    // 🌟 1. 攔截器：先透過 Drive API 檢查檔案是否被丟進垃圾桶
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=trashed`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      // 如果檔案的 trashed 屬性為 true，直接拋出遺失錯誤
      if (driveData.trashed) {
        console.log(`[Drive API] 檔案 ${spreadsheetId} 已被移至垃圾桶，拒絕讀取。`);
        throw new Error('FILE_MISSING_OR_TRASHED');
      }
    } else if (driveRes.status === 404) {
      // 如果 Drive API 說找不到 (代表已經從垃圾桶永久刪除了)
      throw new Error('FILE_MISSING_OR_TRASHED');
    }

    // 🌟 2. 檔案狀態正常 (不在垃圾桶)，才繼續呼叫 Sheets API 讀取內容
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:G`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403 || response.status === 400) {
        throw new Error('FILE_MISSING_OR_TRASHED');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('讀取試算表失敗:', error);
    throw error;
  }
};

/**
 * 設定唯讀分享權限 (供家長端檢視)
 */
export const shareSheetWithParent = async (token, spreadsheetId) => {
  try {
    // 1. 設定權限
    const permRes = await fetch(`${DRIVE_API}/${spreadsheetId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    // 2. 獲取 webViewLink
    const fileRes = await fetch(`${DRIVE_API}/${spreadsheetId}?fields=webViewLink`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(fileRes);
    const fileData = await fileRes.json();
    
    return fileData.webViewLink;
  } catch (error) {
    console.error('設定分享權限失敗:', error);
    throw error;
  }
};

/**
 * 家長端專用：免登入讀取公開的個案日誌
 * 使用 API Key 來讀取設定為 anyone reader 的試算表
 */
export const fetchPublicCaseLog = async (spreadsheetId, apiKey) => {
  try {
    // 1. 取得試算表 metadata (為了拿標題當作學生姓名)
    const metaRes = await fetch(`${SHEETS_API}/${spreadsheetId}?key=${apiKey}`);
    if (!metaRes.ok) throw new Error('無法讀取，可能是權限未開放或網址有誤');
    const metaData = await metaRes.json();
    
    // 移除我們建立檔案時加上的 "[日誌] " 前綴
    const studentName = metaData.properties.title.replace('[日誌] ', '');

    // 2. 取得實際的日誌資料列 (跳過標題列 A2 開始)
    const dataRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A2:G?key=${apiKey}`);
    if (!dataRes.ok) throw new Error('無法讀取日誌內容');
    const data = await dataRes.json();

    return {
      studentName,
      values: data.values || []
    };
  } catch (error) {
    console.error('[DriveService] 讀取公開日誌失敗:', error);
    throw error;
  }
};

// src/utils/googleDriveService.js

// 🌟 更新特定列的日誌資料
export const updateCaseLogRow = async (token, spreadsheetId, rowIndex, rowData) => {
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A${rowIndex}:G${rowIndex}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [rowData] })
  });
  if (!response.ok) throw new Error('更新日誌失敗');
  return response.json();
};

// 🌟 清除特定列的資料 (取代實體刪除，避免破壞其他日誌的列數索引)
export const clearCaseLogRow = async (token, spreadsheetId, rowIndex) => {
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A${rowIndex}:G${rowIndex}:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('清除日誌失敗');
  return response.json();
};