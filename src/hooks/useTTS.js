// src/hooks/useTTS.js
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { applyTTSDictionary } from '../utils/ttsProcessor';

export const useTTS = () => {
  const [voices, setVoices] = useState([]);
  const [activeChunkId, setActiveChunkId] = useState(null); // 取代 highlightRange
  const [ttsState, setTtsState] = useState('stopped');

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  
  // 記錄目前的播放佇列與進度
  const utteranceIdRef = useRef(0);
  const currentChunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  const currentSubjectRef = useRef('general');
  const currentRateRef = useRef(1.0);

  const bestVoice = useMemo(() => {
    const isZh = (v) => String(v?.lang || '').toLowerCase().startsWith('zh');
    const notHK = (v) => !String(v?.lang || '').toLowerCase().includes('zh-hk');
    const candidates = voices.filter((v) => isZh(v) && notHK(v));
    
    const nameRank = (name = '') => {
      if (name.includes('Online (Natural)')) return 0;
      if (name.includes('Yating')) return 1;
      if (name.includes('Mei-Jia')) return 4;
      return 9;
    };

    return candidates.sort((a, b) => {
      const ls = (b.localService ? 0 : 1) - (a.localService ? 0 : 1);
      return ls !== 0 ? ls : nameRank(a.name) - nameRank(b.name);
    })[0] || null;
  }, [voices]);

  // 使用 Ref 保存 bestVoice 避免重新觸發 useCallback
  const bestVoiceRef = useRef(null);
  useEffect(() => { bestVoiceRef.current = bestVoice; }, [bestVoice]);

  const cancel = useCallback(() => {
    utteranceIdRef.current += 1; // 使目前的遞迴佇列失效
    if (synth) synth.cancel();
    setTtsState('stopped');
    setActiveChunkId(null);
  }, [synth]);

  // 🌟 核心：遞迴播放佇列
  const playNext = useCallback((expectedId) => {
    if (expectedId !== utteranceIdRef.current) return;

    const chunks = currentChunksRef.current;
    const index = currentChunkIndexRef.current;

    // 播完了
    if (index >= chunks.length) {
        setTtsState('stopped');
        setActiveChunkId(null);
        return;
    }

    const chunk = chunks[index];
    const processedText = applyTTSDictionary(chunk.spokenText, currentSubjectRef.current);

    // 如果該節點沒有實質語音內容（例如純圖片的空白節點），直接跳下一個
    if (!processedText || processedText.trim() === '。') {
        currentChunkIndexRef.current += 1;
        playNext(expectedId);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = 'zh-TW';
    utterance.rate = currentRateRef.current;
    if (bestVoiceRef.current) utterance.voice = bestVoiceRef.current;

    // 開始唸時，更新 UI 反白
    utterance.onstart = () => {
      if (expectedId === utteranceIdRef.current) {
        setActiveChunkId(chunk.id);
        setTtsState('playing');
      }
    };

    // 唸完時，播放下一個 Chunk
    utterance.onend = () => {
      if (expectedId === utteranceIdRef.current) {
        currentChunkIndexRef.current += 1;
        playNext(expectedId);
      }
    };

    utterance.onerror = (e) => {
      // 被手動 cancel 的 error 不用理會，其餘跳過繼續唸下一段
      if (e.error !== 'canceled' && expectedId === utteranceIdRef.current) {
         console.warn("TTS Error on chunk:", chunk.id, e);
         currentChunkIndexRef.current += 1;
         playNext(expectedId);
      }
    };

    synth.speak(utterance);
  }, [synth]);

  // 🌟 新的 speak 介面：接收 chunks 陣列，而非單一字串
const speak = useCallback((payload, subject = 'general', rate = 0.9, startChunkId = null) => {
    if (!synth || !payload) return;
    cancel(); 

    // ==========================================
    // 🌟 新增：向下相容與自動包裝機制
    // ==========================================
    let validChunks = [];
    if (typeof payload === 'string') {
      // 如果傳入的是純文字 (舊版模組或簡單提示音)，自動包裝成單一 Chunk
      validChunks = [{ id: 'sys_msg', text: payload, spokenText: payload }];
    } else if (Array.isArray(payload)) {
      // 如果是考卷模組傳入的陣列，直接使用
      validChunks = payload;
    }

    if (validChunks.length === 0) return;
    // ==========================================

    const currentId = utteranceIdRef.current;
    
    // 🌟 這裡記得改為 validChunks
    currentChunksRef.current = validChunks; 
    currentSubjectRef.current = subject;
    currentRateRef.current = Math.max(0.5, Math.min(1.05, rate));

    let startIndex = 0;
    if (startChunkId) {
        // 🌟 這裡也記得改為 validChunks
        const idx = validChunks.findIndex(c => c.id === startChunkId);
        if (idx !== -1) startIndex = idx;
    }
    currentChunkIndexRef.current = startIndex;

    setTimeout(() => {
         playNext(currentId);
    }, 50);

  }, [synth, cancel, playNext]);

  const pauseTTS = useCallback(() => {
    if (synth) {
      synth.pause();
      setTtsState('paused');
    }
  }, [synth]);

  const resumeTTS = useCallback(() => {
    if (synth) {
      synth.resume();
      setTtsState('playing');
    }
  }, [synth]);

  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
      cancel();
    };
  }, [synth, cancel]);

  return { speak, cancel, pauseTTS, resumeTTS, ttsState, voices, activeChunkId };
};