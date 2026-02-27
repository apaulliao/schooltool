// src/pages/CaseLog/utils/sheetSchema.js
export const SHEET_HEADERS = [
  'Timestamp', 'Author', 'Date', 'Template_ID', 'Content_JSON', 'Private_Note', 'Attachments'
];

export const encodeRowData = (logEntry) => {
  // 🌟 關鍵修改：將填寫的值 (values) 與當下的模板配置 (template) 一起打包
  const payload = {
    values: logEntry.content || {},
    template: logEntry.template || [] 
  };

  return [
    logEntry.timestamp || new Date().toISOString(),
    logEntry.author || '未設定記錄者',
    logEntry.date || new Date().toISOString().split('T')[0],
    logEntry.templateId || 'default',
    JSON.stringify(payload), // 將打包後的 payload 轉為字串存入 E 欄
    logEntry.privateNote || '',
    (logEntry.attachments || []).join(',')
  ];
};

export const decodeRowData = (row, logId) => {
  const safeRow = row || [];
  
  // 給予預設的安全結構
  let parsedPayload = { values: {}, template: [] }; 
  try {
    if (safeRow[4]) {
      parsedPayload = JSON.parse(safeRow[4]);
    }
  } catch (error) {
    console.error(`[CaseLog Schema] JSON 解析失敗 (Row ID: ${logId}):`, error);
  }

  return {
    id: logId,
    timestamp: safeRow[0] || '',
    author: safeRow[1] || '',
    date: safeRow[2] || '',
    templateId: safeRow[3] || '',
    // 直接明確地讀取打包好的結構
    content: parsedPayload.values || {},
    template: parsedPayload.template || [],
    privateNote: safeRow[5] || '',
    attachments: safeRow[6] ? safeRow[6].split(',').filter(Boolean) : []
  };
};