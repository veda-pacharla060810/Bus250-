'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const SNACKS = [
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🍵', label: 'Tea' },
  { emoji: '🍿', label: 'Popcorn' },
  { emoji: '🍫', label: 'Chocolate' },
];

interface IncomingSnack {
  id: number;
  from: string;
  emoji: string;
  label: string;
}

export default function SnacksTray({ me }: { me: Profile }) {
  const supabase = createClient();
  const [toasts, setToasts] = useState<IncomingSnack[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    const channel = supabase
      .channel('snacks-tray', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'snack' }, (payload) => {
        const { from, emoji, label } = payload.payload as { from: string; emoji: string; label: string };
        const id = idCounter.current++;
        setToasts((prev) => [...prev, { id, from, emoji, label }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  function offer(snack: (typeof SNACKS)[number]) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'snack',
      payload: { from: me.display_name, emoji: snack.emoji, label: snack.label },
    });
  }

  return (
    <>
      <div className="glass-panel flex gap-1 rounded-lg px-2 py-1.5">
        {SNACKS.map((s) => (
          <button
            key={s.label}
            onClick={() => offer(s)}
            title={`Offer ${s.label}`}
            className="rounded-md px-1.5 py-1 text-base transition hover:scale-110 hover:bg-white/5"
          >
            {s.emoji}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass-panel animate-breathe rounded-full px-4 py-2 text-sm text-[#f5ead6] shadow-xl"
          >
            {t.emoji} {t.from} passed you {t.label.toLowerCase() === 'coffee' || t.label.toLowerCase() === 'tea' ? 'a' : 'some'} {t.label}
          </div>
        ))}
      </div>
    </>
  );
}
