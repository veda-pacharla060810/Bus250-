'use client';
import { useEffect, useRef, useState } from 'react';

type Track = 'rain' | 'engine' | 'quiet';

const TRACKS: { key: Track; label: string; emoji: string }[] = [
  { key: 'rain', label: 'Rain on the window', emoji: '🌧️' },
  { key: 'engine', label: 'Engine hum', emoji: '🚌' },
  { key: 'quiet', label: 'Quiet night', emoji: '🌙' },
];

export default function AmbientSounds({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<Track | null>(null);
  const [volume, setVolume] = useState(0.4);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      nodesRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.1);
    }
  }, [volume]);

  function ensureContext() {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }

  function stopCurrent() {
    nodesRef.current?.stop();
    nodesRef.current = null;
  }

  function playRain(ctx: AudioContext) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    gainRef.current = gain;

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();

    return { stop: () => noise.stop() };
  }

  function playEngine(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.5;
    gainRef.current = gain;

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    lfo.start();

    return {
      stop: () => {
        osc.stop();
        lfo.stop();
      },
    };
  }

  function select(track: Track) {
    stopCurrent();
    if (active === track) {
      setActive(null);
      return;
    }
    const ctx = ensureContext();
    if (ctx.state === 'suspended') ctx.resume();

    if (track === 'rain') nodesRef.current = playRain(ctx);
    else if (track === 'engine') nodesRef.current = playEngine(ctx);
    else nodesRef.current = { stop: () => {} }; // quiet = nothing playing

    setActive(track);
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-night-950/50 backdrop-blur-sm"
        onClick={() => {
          onClose();
        }}
      />
      <div className="glass-panel relative z-10 w-80 rounded-2xl border-2 border-amber-glow/20 p-5 text-center shadow-2xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-amber-glow/60">Ambient · Bus 250</p>

        <div className="space-y-2">
          {TRACKS.map((t) => (
            <button
              key={t.key}
              onClick={() => select(t.key)}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                active === t.key ? 'border-amber-glow/60 bg-amber-glow/10 text-amber-glow' : 'border-white/10 bg-white/[0.02] text-[#f5ead6]/80 hover:border-white/20'
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs">🔉</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-amber-glow"
          />
        </div>

        <button
          onClick={() => {
            stopCurrent();
            onClose();
          }}
          className="mt-4 text-xs text-[#f5ead6]/40 hover:text-amber-glow"
        >
          Close
        </button>
      </div>
    </div>
  );
}
