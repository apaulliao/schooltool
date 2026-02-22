// src/constants/ttsDictionary.js

// ==========================================
// 1. 靜態字元替換字典 (單字元或固定字串)
// ==========================================

export const GENERAL_DICT = {
  '○': '圈', '△': '三角形', '□□': '框框', '□': '框框',
  // 🌟 新增：解決「打叉、打圈」的情境，同時相容大小寫英文X與O
  '打×': '打叉', '打X': '打叉', '打x': '打叉', '打✕': '打叉',
  '打○': '打圈', '打O': '打圈', '打o': '打圈',
  '①': '一', '②': '二', '③': '三', '④': '四', '⑤': '五',
  '⑥': '六', '⑦': '七', '⑧': '八', '⑨': '九', '⑩': '十',
  '→': '、', 
  '⇒': '、'
};

export const MATH_DICT = {
  '×': '乘以', '÷': '除以', '＋': '加', '+': '加', '－': '減', '-': '減', '＝': '等於', '=': '等於',
  '≠': '不等於', '≈': '約等於', '±': '正負', '≤': '小於或等於', '≥': '大於或等於',
  '∠': '角', '⊥': '垂直於', '∥': '平行於', 'π': '圓周率',
  '∴': '所以', '∵': '因為', '≅': '全等於', '∼': '相似於', '∞': '無限大', '√': '根號'
};

export const SCIENCE_DICT = {
  'Ω': '歐姆', 'μ': '微', 'λ': '波長', 'Δ': '變化量', 'θ': '西塔',
  '℃': '攝氏度', '℉': '華氏度', 
  '⇌': '可逆反應', '↑': '產生氣體', '↓': '產生沉澱'
};

export const ELEMENTARY_ABBR_DICT = {
  'km': '公里', 'm': '公尺', 'cm': '公分', 'mm': '毫米', 'μm': '微米', 'nm': '奈米',
  'kg': '公斤', 'g': '公克', 'mg': '毫克', 't': '公噸',
  'L': '公升', 'ml': '毫升', 'c.c.': '西西',
  'Hz': '赫茲', 'dB': '分貝', 'mA': '毫安培', 'kW': '千瓦', 'kWh': '度電', 'ppm': '百萬分點',
  'AM': '上午', 'PM': '下午'  
};

export const DEFAULT_TTS_DICT = {
  ...GENERAL_DICT,
  ...MATH_DICT,
  ...SCIENCE_DICT,
  ...ELEMENTARY_ABBR_DICT
};

const UNIT_NAME_MAP = {
  'km': '公里', 'm': '公尺', 'cm': '公分', 'mm': '毫米',
  'kg': '公斤', 'g': '公克', 't': '公噸',
  'L': '公升', 'ml': '毫升', 'c.c.': '西西',
  'hr': '小時', 'h': '小時', 's': '秒', 'min': '分鐘'
};

const SUBSCRIPT_TO_SPOKEN = {
  '₀':'零', '₁':'一', '₂':'二', '₃':'三', '₄':'四', '₅':'五', '₆':'六', '₇':'七', '₈':'八', '₉':'九',
  '₊':'正', '₋':'負', 'ₓ':'x', 'ₐ':'a', 'ₑ':'e', 'ₒ':'o'
};

export const getExamReaderDict = (subject = 'general') => {
  const baseDict = { ...GENERAL_DICT };
  switch (subject) {
    case 'math':
    case 'science':
      return { ...baseDict, ...MATH_DICT, ...SCIENCE_DICT, ...ELEMENTARY_ABBR_DICT };
    case 'english':
      return baseDict;
    default:
      return DEFAULT_TTS_DICT;
  }
};

export const getExamRegexPatterns = (subject = 'general') => {
  const basePatterns = [
    {
      pattern: /[(（「【][\s_＿]*[)）」】]/g,
      replacement: '、空格、' 
    },
    {
      pattern: /[_＿]{3,}/g,
      replacement: '、' 
    },
    {
      pattern: /(\d+)\/(\d+)/g,
      replacement: (match, numerator, denominator) => `${denominator}分之${numerator}`
    }
  ];

  if (subject !== 'english') {
    basePatterns.push(
      {
        pattern: /\b(km|m|cm|mm)([\^]?)([23²³])(?!\d)/gi,
        replacement: (match, unit, hat, power) => {
          const prefix = (power === '2' || power === '²') ? '平方' : '立方';
          const unitName = UNIT_NAME_MAP[unit.toLowerCase()] || unit;
          return `${prefix}${unitName}`;
        }
      },
      {
        pattern: /([a-zA-Z0-9])(?:[\^]([a-zA-Z0-9]+)|([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣʸ]+))/g,
        replacement: (match, base, hatPower, supPower) => {
          const SUP_TO_NORMAL = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁺':'+', '⁻':'-', 'ⁿ':'n', 'ˣ':'x', 'ʸ':'y' };
          let power = hatPower;
          if (supPower) {
            power = supPower.split('').map(c => SUP_TO_NORMAL[c] || c).join('');
          }
          return `${base}的${power}次方`;
        }
      },
      {
        pattern: /([₀-₉₊₋ₓₐₑₒ])/g,
        replacement: (match) => SUBSCRIPT_TO_SPOKEN[match] || match
      },
      {
        pattern: /\b(km|m)\/(hr|h|s|min)\b/gi,
        replacement: (match, numerator, denominator) => {
          const numName = UNIT_NAME_MAP[numerator.toLowerCase()] || numerator;
          const denName = UNIT_NAME_MAP[denominator.toLowerCase()] || denominator;
          return `每${denName}${numName}`; 
        }
      },
      {
        pattern: /(\d+)\s*([CcFf])\b/g,
        replacement: (match, temp, unit) => {
          const unitName = unit.toLowerCase() === 'c' ? '度' : '華氏度';
          return `${temp}${unitName}`;
        }
      }
    );
  }
  return basePatterns;
};