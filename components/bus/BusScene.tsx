'use client';
import type { Profile, PresenceRow, SceneryTheme, OverlayKind } from '@/lib/types';
import Seat from './Seat';
import Odometer from './Odometer';
import LoveNoteProp from './LoveNoteProp';
import SnacksTray from './SnacksTray';
import MoodLightControl, { useMoodWarmth } from './MoodLightControl';

const THEMES: Record<SceneryTheme, { sky: string; accent: string; label: string }> = {
  rainy_city: { sky: 'from-[#1a1f2e] via-[#232a3d] to-[#0d0f18]', accent: '#7fa8c9', label: 'Rainy City' },
  countryside: { sky: 'from-[#2b3a2e] via-[#38492f] to-[#12180f]', accent: '#c7d98a', label: 'Countryside' },
  bridge: { sky: 'from-[#22283a] via-[#2c3550] to-[#0e1120]', accent: '#e0c15c', label: 'Bridge' },
  forest: { sky: 'from-[#16231c] via-[#1e3327] to-[#0a120d]', accent: '#7fc98a', label: 'Forest' },
  sunset_highway: { sky: 'from-[#3a2338] via-[#7a3b3b] to-[#e0824a]', accent: '#ffb454', label: 'Sunset Highway' },
  snow: { sky: 'from-[#39435a] via-[#5c6b8a] to-[#dfe6ef]', accent: '#eef3fa', label: 'Snow' },
};

export default function BusScene({
  theme,
  onChangeTheme,
  me,
  friend,
  myPresence,
  friendPresence,
  onOpenOverlay,
  onOpenSounds,
}: {
  theme: SceneryTheme;
  onChangeTheme: (t: SceneryTheme) => void;
  me: Profile;
  friend: Profile;
  myPresence?: PresenceRow;
  friendPresence?: PresenceRow;
  onOpenOverlay: (o: OverlayKind) => void;
  onOpenSounds: () => void;
}) {
  const t = THEMES[theme];
  const warmth = useMoodWarmth(); // 0-100, synced live between both seats

  return (
    <div className="absolute inset-0">
      {/* Mood lighting tint over the whole interior, driven by the shared warmth value */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 70%, rgba(255,180,84,${warmth / 220}), transparent 70%)`,
        }}
      />

      <div className="absolute inset-x-0 top-0 flex h-[46%] gap-3 px-6 pt-6">
        {[0, 1].map((i) => (
          <div key={i} className="relative flex-1 overflow-hidden rounded-b-3xl border-4 border-[#2a1d12] shadow-inner">
            <div key={theme} className={`absolute inset-0 bg-gradient-to-b ${t.sky} transition-opacity duration-[2000ms]`}>
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 animate-drift opacity-70"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${t.accent}22 0 40px, transparent 40px 120px)`,
                  width: '200%',
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1/3 animate-driftSlow opacity-40"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${t.accent}33 0 20px, transparent 20px 70px)`,
                  width: '200%',
                }}
              />
              {theme === 'rainy_city' && (
                <div
                  className="absolute inset-0 animate-rain opacity-30"
                  style={{ backgroundImage: 'repeating-linear-gradient(100deg, transparent 0 14px, #bcd8ff33 14px 15px)' }}
                />
              )}
              {theme === 'snow' && (
                <div
                  className="absolute inset-0 animate-fog opacity-50"
                  style={{
                    backgroundImage:
                      'radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(2px 2px at 60% 70%, #fff, transparent), radial-gradient(1px 1px at 80% 20%, #fff, transparent)',
                  }}
                />
              )}
            </div>
            <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#2a1d12]/60" />
          </div>
        ))}
      </div>

      <button
        onClick={() => onOpenOverlay('routemap')}
        className="absolute left-1/2 top-3 -translate-x-1/2 rounded-md border border-amber-glow/30 bg-night-900/70 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-glow/80 shadow-lg transition hover:border-amber-glow/70 hover:text-amber-glow"
      >
        ✦ Route · {t.label}
      </button>

      <div className="absolute right-6 top-3 z-10 flex items-center gap-2">
        <Odometer />
        <MoodLightControl warmth={warmth} />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-b from-[#1b140d] to-[#0d0906]">
        <div className="mx-auto flex h-full max-w-4xl items-end justify-between px-10 pb-28 pt-8">
          <div className="flex flex-col items-center gap-3">
            <Seat profile={me} presence={myPresence} isMe />
            <LoveNoteProp me={me} friend={friend} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <Seat profile={friend} presence={friendPresence} isMe={false} />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
          <Prop label="Notebook" onClick={() => onOpenOverlay('journal')} />
          <Prop label="Photos" onClick={() => onOpenOverlay('gallery')} />
          <Prop label="Booth" onClick={() => onOpenOverlay('photobooth')} />
          <Prop label="Tickets" onClick={() => onOpenOverlay('tickets')} />
          <Prop label="Sounds" onClick={onOpenSounds} />
          <SnacksTray me={me} />
        </div>
      </div>
    </div>
  );
}

function Prop({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-panel rounded-lg px-4 py-2 text-xs text-[#f5ead6]/80 shadow-lg transition hover:-translate-y-0.5 hover:text-amber-glow"
    >
      {label}
    </button>
  );
}
