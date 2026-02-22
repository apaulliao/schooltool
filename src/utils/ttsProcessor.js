// src/utils/ttsProcessor.js
import { getExamReaderDict, getExamRegexPatterns } from '../constants/ttsDictionary';

export const applyTTSDictionary = (text, subject = 'general') => {
  if (!text) return '';

  let customDict = {};
  try { customDict = JSON.parse(localStorage.getItem('tts_custom_dict')) || {}; } catch (e) {}

  const baseDict = getExamReaderDict(subject);
  const activeDict = { ...baseDict, ...customDict };
  const customPatterns = getExamRegexPatterns(subject);
  const sortedKeys = Object.keys(activeDict).sort((a, b) => b.length - a.length);

  let preprocessedText = text;

  // 1. 正則表達式替換 (Regex Patterns)
  customPatterns.forEach(({ pattern, replacement }) => {
    pattern.lastIndex = 0; 
    preprocessedText = preprocessedText.replace(pattern, typeof replacement === 'function' ? replacement : () => replacement);
  });

  // 2. 靜態字典替換與標籤轉換
  let fullSpokenText = '';
  let i = 0;
  
  while (i < preprocessedText.length) {
    const optMatch = preprocessedText.slice(i).match(/^[(（]\s*([A-FＡ-Ｆa-fａ-ｆ]|[0-9０-９]{1,2}|甲|乙|丙|丁)\s*[)）]/);
    const circleMatch = preprocessedText.slice(i).match(/^([①-⑳])/);

    if (optMatch) {
      let optVal = optMatch[1].toUpperCase(); 
      if (/^[0-9]+$/.test(optVal)) {
        const numMap = {'1':'一','2':'二','3':'三','4':'四','5':'五','6':'六','7':'七','8':'八','9':'九','10':'十'};
        optVal = numMap[optVal] || optVal;
      } else if (/^[A-Z]$/.test(optVal)) {
        optVal = String.fromCharCode(optVal.charCodeAt(0) + 0xFEE0); 
      }
      fullSpokenText += `${optVal}、`; 
      i += optMatch[0].length;
      continue;
    } else if (circleMatch) {
      const optVal = circleMatch[1];
      const readVal = activeDict[optVal] || optVal;
      fullSpokenText += `${readVal}、`; 
      i += circleMatch[0].length;
      continue;
    }

    let matchedKey = sortedKeys.find(key => preprocessedText.startsWith(key, i));

    // 防止把英文單字內的字元錯誤替換 (例如 "hm" 裡的 "m")
    if (matchedKey && /^[a-zA-Z.]+$/.test(matchedKey)) {
      const prevChar = i > 0 ? preprocessedText[i - 1] : '';
      const nextChar = preprocessedText[i + matchedKey.length] || '';
      const isEnglishChar = /[a-zA-Z]/;
      if (isEnglishChar.test(prevChar) || isEnglishChar.test(nextChar)) {
        matchedKey = undefined; 
      }
    }

    if (matchedKey) {
      fullSpokenText += activeDict[matchedKey];
      i += matchedKey.length;
    } else {
      fullSpokenText += preprocessedText[i];
      i++;
    }
  }

  // 確保結尾有句號，讓語音引擎可以自然換氣與煞車
  if (!/[。？！.?!]$/.test(fullSpokenText)) {
    fullSpokenText += '。';
  }

  return fullSpokenText;
};