import { useRef, useCallback } from 'react';

export const useAudio = () => {
  const audioCtxRef = useRef(null);

  // 初始化 AudioContext
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // 音效產生器
  const createSimpleTone = useCallback((ctx, freq, type, start, duration, volume) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }, []);

  const playAudio = useCallback((soundType) => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    switch (soundType) {
      // ===========================
      // 1. 馬力歐風格加分
      // ===========================
      case 'coin': 
        createSimpleTone(ctx, 988, 'square', now, 0.08, 0.1);
        createSimpleTone(ctx, 1319, 'square', now + 0.06, 0.3, 0.1);
        break;

      case 'coin_group': 
        [1046.5, 1318.5, 1568.0, 2093.0].forEach((freq, i) => {
            createSimpleTone(ctx, freq, 'square', now + i * 0.05, 0.1, 0.08);
        });
        break;

      case 'coin_class':
        [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1568.0].forEach((freq, i) => {
            createSimpleTone(ctx, freq, 'square', now + i * 0.04, 0.15, 0.06);
        });
        break;

      case 'level_up': 
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
             createSimpleTone(ctx, freq, 'square', now + i * 0.08, 0.1, 0.08);
        });
        createSimpleTone(ctx, 1568.0, 'square', now + notes.length * 0.08, 0.6, 0.1);
        break;

      case 'negative': { // ★ 加了大括號
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth'; 
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
      }

      // ===========================
      // 2. 氣氛營造 (變數最多的地方，務必加括號)
      // ===========================
      case 'drumroll': { // ★ 加了大括號，隔離 count 變數
         const duration = 2.0; 
         const count = 40;     
         for(let i=0; i<count; i++) {
             const t = now + (i * (duration / count));
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.type = 'triangle'; 
             osc.frequency.value = 80 + Math.random() * 60; 
             gain.gain.setValueAtTime(0.05 + (i/count)*0.15, t); 
             gain.gain.linearRampToValueAtTime(0, t + 0.05);
             osc.connect(gain);
             gain.connect(ctx.destination);
             osc.start(t);
             osc.stop(t + 0.05);
         }
         break;
      }

      case 'applause': { // ★ 加了大括號，這裡也有 count，現在安全了
         // 1. 勝利號角
         const chord = [261.63, 329.63, 392.00, 523.25];
         chord.forEach((freq, i) => {
            const t = now + i * 0.08;
            
            // Layer A: Sawtooth
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth'; 
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.1); 
            gain.gain.linearRampToValueAtTime(0.15, t + 0.4); 
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0); 
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2.0);

            // Layer B: Square
            createSimpleTone(ctx, freq * 2, 'square', t, 0.1, 0.05);
         });

         // 2. 禮炮煙火
         const count = 6; // 這裡宣告的 count 現在只屬於 applause 房間
         for (let i = 0; i < count; i++) {
            const t = now + 0.4 + Math.random() * 0.8;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + Math.random() * 400, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
         }
         break;
      }

      case 'whistle': { // ★ 加了大括號
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.frequency.setValueAtTime(2500, now);
        osc2.frequency.setValueAtTime(2600, now);
        
        osc1.frequency.linearRampToValueAtTime(2800, now + 0.1);
        osc2.frequency.linearRampToValueAtTime(2900, now + 0.1);
        osc1.frequency.linearRampToValueAtTime(2500, now + 0.8);
        osc2.frequency.linearRampToValueAtTime(2600, now + 0.8);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
        break;
      }

      // ===========================
      // 3. 基礎功能音效
      // ===========================
      case 'tick':
        createSimpleTone(ctx, 1000, 'triangle', now, 0.05, 0.15);
        break;

      case 'alarm':
        for (let i = 0; i < 4; i++) { createSimpleTone(ctx, 2000, 'square', now + i * 0.15, 0.08, 0.1); }
        break;

      case 'correct':
        [523.25, 659.25, 783.99].forEach((f, i) => createSimpleTone(ctx, f, 'triangle', now + i * 0.1, 0.5, 0.1));
        break;

      case 'wrong': { // ★ 加了大括號
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.5);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
      }
        
      case 'alert':
        for (let i = 0; i < 3; i++) { createSimpleTone(ctx, 880, 'square', now + i * 0.15, 0.1, 0.05); }
        break;

      default:
        createSimpleTone(ctx, 440, 'sine', now, 0.1, 0.1);
        break;
    }
  }, [initAudio, createSimpleTone]);

  return { playAudio, initAudio };
};