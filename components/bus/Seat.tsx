'use client';
import type { Profile, PresenceRow } from '@/lib/types';

export default function Seat({
  profile,
  presence,
  isMe,
}: {
  profile: Profile;
  presence?: PresenceRow;
  isMe: boolean;
}) {
  const status = presence?.status ?? 'offline';
  const isOnline = status === 'online' || status === 'typing';
  const isTyping = status === 'typing';

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative h-24 w-20 rounded-t-2xl border-2 transition-all duration-700 ${
          isOnline ? 'border-amber-glow/60 animate-breathe' : 'border-white/10 opacity-40'
        }`}
        style={{
          background: isOnline
            ? 'radial-gradient(circle at 50% 30%, rgba(255,180,84,0.35), rgba(90,64,32,0.15))'
            : 'rgba(255,255,255,0.03)',
        }}
      >
        {isTyping && <div className="absolute inset-0 rounded-t-2xl bg-white/20 animate-fog" />}
      </div>
      <p className="text-xs text-[#f5ead6]/70">
        {profile.display_name}
        {isMe ? ' (you)' : ''}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-[#f5ead6]/30">
        {isTyping ? 'typing…' : isOnline ? 'here' : 'away'}
      </p>
    </div>
  );
}
