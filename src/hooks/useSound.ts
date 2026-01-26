import { useCallback, useRef, useEffect } from 'react';

// A small, pleasant "pop" sound as base64
// This is a tiny WAV file (~3KB) that plays a soft completion chime
const COMPLETE_SOUND_BASE64 = `data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAAAAAAEAAgADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2ADcAOAA5ADoAOwA8AD0APgA/AEAAQQBCAEMARABFAEYARwBIAEkASgBLAEwATQBOAE8AUABRAFIAUwBUAFUAVgBXAFgAWQBaAFsAXABdAF4AXwBgAGEAYgBjAGQAZQBmAGcAaABpAGoAawBsAG0AbgBvAHAAcQByAHMAdAB1AHYAdwB4AHkAegB7AHwAfQB+AH8AgACBAIIAgwCEAIUAhgCHAIgAiQCKAIsAjACNAI4AjwCQAJEAkgCTAJQAlQCWAJcAmACZAJoAmwCcAJ0AngCfAKAAoQCiAKMApAClAKYApwCoAKkAqgCrAKwArQCuAK8AsACxALIAswC0ALUAtgC3ALgAuQC6ALsAvAC9AL4AvwDAAMEAwgDDAMQAxQDGAMcAyADJAMoAywDMAM0AzgDPANAA0QDSANMA1ADVANYA1wDYANkA2gDbANwA3QDeAN8A4ADhAOIA4wDkAOUA5gDnAOgA6QDqAOsA7ADtAO4A7wDwAPEA8gDzAPQA9QD2APcA+AD5APoA+wD8AP0A/gD/AAAADwAeAC0APABLAF8AcwCHAJsArwDDANcA6wD/ABMBJwE7AU8BYwF3AYsBnwGzAccB2wHvAQMCFwIrAj8CUwJnAnsCjwKjArcCywLfAvMCBwMbAy8DQwNXA2sDfwOTA6cDuwPPA+MD9wMLBB8EMwRHBFsEbwSDBJcEqwS/BNME5wT7BA8FIwU3BUsFXwVzBYcFmwWvBcMF1wXrBf8FEwYnBjsGTwZjBncGiwafBrMGxwbbBu8GAwcXBysHPwdTB2cHewePB6MHtwe/B8cHzwfXB98H5wfvB/cH/wcHCAsIDwgTCBcIGwgfCCMIJwgrCC8IMwg3CDsIPwhDCEcISwg7CC8IIwgXCAsI/wfzB+cH2wfPB8MHtwevB6cHnweXB48HhweDB38Hewd3B3MHbwdrB2cHYwdfB1sHVwdTB08HSwdHB0MHPwc7BzcHMwcvBysHJwcjBx8HGwcXBxMHDwcLBwcHAwf/BvsG9wbzBu8G6wbnBucG5wbnBucG6wbrBu8G7wbvBu8G6wbpBucG5wblBuMG4QbfBt0G2wbZBtcG1QbTBtEGzwbNBssGyQbHBsUGwwa/Br0GuwazBqsGowaXBosGfwZzBmcGWwZPBkMGNwYrBh8GEwYHBvsF7wXjBdcFywW/BbMFpwWbBY8FgwV3BWsFXwVTBUcFOwUvBSMFFwULBf8E8wTnBNsEzwTDBLcEqwSfBJMEhwR7BG8EYwRXBEsEPwQzBCcEGwQPBAME9wPrA98D0wPHA7sDrwOjA5cDiwN/A3MDZwNbA08DQwM3AysDHwMTAwcD+wLvAuMC1wLLAr8CswKnApsCjwKDAncCcQJlAlkCTQJBAjUCKQIdAhECBQL5Ae0B4QHVAckBvQGxAaUBmQGNAYEBdQFpAV0BUQFFATkBLQEhARUBCQH9APEA5QDZAM0AwQC1AKkAnQCRAIUAeQBtAGEAVQBJAD0AMQA=`;

export function useSound(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pre-load the audio
    audioRef.current = new Audio(COMPLETE_SOUND_BASE64);
    audioRef.current.volume = 0.3;

    return () => {
      audioRef.current = null;
    };
  }, []);

  const playComplete = useCallback(() => {
    if (enabled && audioRef.current) {
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }, [enabled]);

  return { playComplete };
}

// Haptic feedback utility
export function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10); // Short 10ms vibration
  }
}
