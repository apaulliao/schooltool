import { useCallback } from 'react';

/**
 * 專門處理學生名單匯入解析的 Hook
 * 邏輯包含：性別判斷、中文數字轉換、組別與分數歧義辨識
 */
export const useStudentImport = () => {
 
const toNum = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};
 
  // --- 性別判斷 ---
  const isGender = (str) => {
    const s = String(str).trim();
    return ['F', 'M', '女', '男', '女生', '男生', 'f', 'm'].includes(s);
  };

  const normalizeGender = (str) => {
    const s = String(str).trim().toUpperCase();
    if (s === 'F' || s.startsWith('女')) return 'F';
    return 'M';
  };

  // --- 中文數字轉阿拉伯數字：支援 1~99 ---
  const cnToInt = (cnRaw) => {
    const cn = String(cnRaw).trim();
    if (!cn) return null;

    const map = { '零':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };
    if (cn === '十') return 10;

    if (cn.length === 1 && map.hasOwnProperty(cn)) return map[cn];

    const tenIdx = cn.indexOf('十');
    if (tenIdx >= 0) {
      const left = cn.slice(0, tenIdx);
      const right = cn.slice(tenIdx + 1);
      const tens = left === '' ? 1 : (map[left] ?? null);
      if (tens == null) return null;
      const ones = right === '' ? 0 : (map[right] ?? null);
      if (ones == null) return null;
      return tens * 10 + ones;
    }
    return null;
  };

  // --- 組別字串辨識 ---
  const parseGroupToken = (tokenRaw) => {
    const token = String(tokenRaw).trim();
    if (!token) return null;

    // 1) G1 / Group 2
    let m = token.match(/^(?:G|g)\s*(\d+)$/) || token.match(/^(?:Group|group)\s*(\d+)$/);
    if (m) return parseInt(m[1], 10);

    // 2) 1組 / 10組
    m = token.match(/^(\d+)\s*組$/);
    if (m) return parseInt(m[1], 10);

    // 3) 第一組 / 第十組 / 十二組
    m = token.match(/^第?\s*([零一二兩三四五六七八九十]{1,3})\s*組$/);
    if (m) {
      const n = cnToInt(m[1]);
      return n == null ? null : n;
    }

    // 4) 單純中文數字 "一"
    const n2 = cnToInt(token);
    if (n2 != null) return n2;

    return null;
  };

  // --- 分數字串辨識 ---
  const parseScoreToken = (tokenRaw) => {
    const token = String(tokenRaw).trim();
    if (!token) return null;

    // 95分
    let m = token.match(/^(\d+(?:\.\d+)?)\s*分$/);
    if (m) return parseFloat(m[1], 10);

    // S95
    m = token.match(/^(?:S|s)\s*(\d+(?:\.\d+)?)$/);
    if (m) return parseFloat(m[1], 10);

    // 純數字
	return toNum(token);
  };

  // --- 將候選欄位解析成 group / performance ---
  const parseGroupAndPerformance = (tokens) => {
    let group = '';
    let performance = null;

    const t1 = tokens[0] ?? '';
    const t2 = tokens[1] ?? '';

    if (!t1 && !t2) return { group, performance };

    // 只有一格
    if (t1 && !t2) {
      const g = parseGroupToken(t1);
      if (g != null) return { group: String(g), performance: null };

      const s = parseScoreToken(t1);
      if (s != null) {
        if (s >= 10) return { group: '', performance: s };
        return { group: String(s), performance: null };
      }
      return { group: t1, performance: null };
    }

    // 兩格：優先處理明確格式
    const g1 = parseGroupToken(t1);
    if (g1 != null) group = String(g1);
    else group = t1;

    const s2 = parseScoreToken(t2);
    if (s2 != null) {
      performance = s2;
    } else {
      group = group ? `${group} ${t2}` : t2;
    }

    return { group, performance };
  };

  /**
   * 主要解析函式
   */
  const parseImportText = useCallback((text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const result = [];

    for (const line of lines) {
      // 支援多種分隔符號
      const parts = line.split(/[\t\s,]+/).filter(Boolean);
      if (parts.length < 2) continue;

      const number = parts[0].trim();
      const name = parts[1].trim();

      let gender = 'M';
      let candidate = [];

      // 判斷第三欄是否為性別
      if (parts.length >= 3 && isGender(parts[2])) {
        gender = normalizeGender(parts[2]);
        candidate = parts.slice(3, 5); // 抓取第 4, 5 欄
      } else {
        candidate = parts.slice(2, 4); // 抓取第 3, 4 欄
      }

      const { group, performance } = parseGroupAndPerformance(candidate);

      result.push({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? `s_${crypto.randomUUID()}`
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        number,
        name,
        gender,
        group,
        performance,
        locked: false
      });
    }
    return result;
  }, []);

  return { parseImportText };
};