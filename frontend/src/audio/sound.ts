import { useMemo, useCallback } from 'react';

import bgMusic from './bg.mp3';
import tickSound from './tick.mp3';
import tickFinalSound from './tick_final.mp3';
import startSound from './start.mp3';
import crashSound from './thud.mp3';
import starLossSound from './star_down.mp3';
import revealSound from './reveal.mp3';
import toggleOnSound from './toggle_on.mp3';
import toggleOffSound from './toggle_off.mp3';
import winSound from './win.wav';
import failSound from './fail.mp3';
import playBtnSound from './play.wav';
import slideSound from './slide2.wav';
import hoverSound from './hover2.mp3';

// Tipus de configuració d'un so
type SoundConfig = { src: string; volume?: number; loop?: boolean }

// Mapa de configuració de tots els sons
const soundMap: Record<string, SoundConfig> = {
  music: { src: bgMusic, loop: true, volume: 0.5 },
  tick: { src: tickSound, volume: 0.7 },
  tickFinal: { src: tickFinalSound, volume: 0.8 },
  start: { src: startSound, volume: 0.7 },
  crash: { src: crashSound, volume: 0.7 },
  starLoss: { src: starLossSound, volume: 0.7 },
  reveal: { src: revealSound, volume: 0.7 },
  toggleOn: { src: toggleOnSound, volume: 0.7 },
  toggleOff: { src: toggleOffSound, volume: 0.7 },
  win: { src: winSound, volume: 0.8 },
  fail: { src: failSound, volume: 0.7 },
  playBtn: { src: playBtnSound, volume: 0.7 },
  slide: { src: slideSound, volume: 0.8 },  
  hover: { src: hoverSound, volume: 0.5 },
};

type SoundKey = keyof typeof soundMap;

// Helper per reproduir sons curts
const playSound = (audio: HTMLAudioElement | null | undefined) => {
  if (!audio) return;
  audio.currentTime = 0; 
  audio.play().catch(e => console.error("Error en reproduir àudio:", e));
};


// Helper per reproduir sons que poden solapar-se
const playOverlapSound = (audio: HTMLAudioElement | null | undefined) => {
  if (!audio) return;
  const clone = audio.cloneNode(true) as HTMLAudioElement;
  clone.volume = audio.volume;
  clone.play().catch(e => console.error("Error en reproduir àudio:", e));
};

export const useGameAudio = () => {
  // Carregar tots els sons
  const audioCache = useMemo<Map<SoundKey, HTMLAudioElement | null>>(() => {
    if (typeof window === 'undefined') {
      return new Map<SoundKey, HTMLAudioElement | null>();
    }

    const cache = new Map<SoundKey, HTMLAudioElement | null>();
    for (const key in soundMap) {
      const k = key as SoundKey;
      const config = soundMap[k];
      const audio = new Audio(config.src);
      audio.loop = !!config.loop;
      audio.volume = config.volume ?? 1.0;
      audio.preload = 'auto';
      audio.load();
      cache.set(k, audio);
    }
    return cache;
  }, []);

  // Retornem un objecte amb funcions estables (useCallback)
  return {
    playTick: useCallback(() => playSound(audioCache.get('tick')), [audioCache]),
    playTickFinal: useCallback(() => playSound(audioCache.get('tickFinal')), [audioCache]),
    playStart: useCallback(() => playSound(audioCache.get('start')), [audioCache]),
    playCrash: useCallback(() => playSound(audioCache.get('crash')), [audioCache]),
    playStarLoss: useCallback(() => playSound(audioCache.get('starLoss')), [audioCache]),
    playReveal: useCallback(() => playSound(audioCache.get('reveal')), [audioCache]),
    playToggleOn: useCallback(() => playOverlapSound(audioCache.get('toggleOn')), [audioCache]),
    playToggleOff: useCallback(() => playOverlapSound(audioCache.get('toggleOff')), [audioCache]),
    playWin: useCallback(() => playSound(audioCache.get('win')), [audioCache]),
    playFail: useCallback(() => playOverlapSound(audioCache.get('fail')), [audioCache]),
    playBtnSound: useCallback(() => playOverlapSound(audioCache.get('playBtn')), [audioCache]),
    playSlide: useCallback(() => playOverlapSound(audioCache.get('slide')), [audioCache]),
    playHover: useCallback(() => playOverlapSound(audioCache.get('hover')), [audioCache]),

    startMusic: useCallback(() => {
      audioCache.get('music')?.play().catch(e => console.error("Error al reproduir música:", e));
    }, [audioCache]),
    
    stopMusic: useCallback(() => {
      const music = audioCache.get('music');
      if (music) {
        music.pause();
        music.currentTime = 0;
      }
    }, [audioCache]),
  };
};
