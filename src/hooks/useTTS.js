import { useCallback, useEffect, useState, useRef } from 'react';

export const useTTS = () => {
    const [voices, setVoices] = useState([]);
    const synth = window.speechSynthesis;

    useEffect(() => {
        const loadVoices = () => {
            const vs = synth.getVoices();
            setVoices(vs);
        };
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    }, [synth]);

    const speak = useCallback((text, lang = 'zh-TW', rate = 0.9) => {
        if (!synth) return;
        
        // 強制中斷目前的發音
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;

        // 智慧選擇語音包 (優先選 Google 中文 或 微軟 Hanhan)
        const bestVoice = voices.find(v => 
            (v.lang.includes(lang) || v.lang.includes('zh-CN')) && 
            !v.name.includes('Hong Kong') // 排除粵語
        );
        if (bestVoice) utterance.voice = bestVoice;

        synth.speak(utterance);
    }, [voices, synth]);

    const cancel = useCallback(() => {
        if (synth) synth.cancel();
    }, [synth]);

    return { speak, cancel, voices };
};