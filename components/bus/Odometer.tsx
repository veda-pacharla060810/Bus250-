'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Every message the two of you send moves the bus forward a little.
// This is purely a fun, persisted-by-derivation stat — no new table needed,
// it's just derived live from the messages count.
const KM_PER_MESSAGE = 0.15;

export default function Odometer() {
  const supabase = createClient();
  const [count, setCount] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      const { count: total } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('deleted', false);
      if (!cancelled && typeof total === 'number') setCount(total);
    }
    loadCount();

    const channel = supabase
      .channel('odometer-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        setCount((c) => c + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        // if a message gets soft-deleted, roll the odometer back slightly
        const row = payload.new as { deleted: boolean };
        const old = payload.old as { deleted: boolean };
        if (row.deleted && !old.deleted) setCount((c) => Math.max(0, c - 1));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Smoothly animate the displayed distance toward the real value whenever it changes
  useEffect(() => {
    const target = count * KM_PER_MESSAGE;
    const start = displayed;
    const startTime = performance.now();
    const duration = 900;

    function tick(now: number) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(start + (target - start) * eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    }
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const digits = displayed.toFixed(1);

  return (
    <div className="glass-panel flex items-center gap-2 rounded-lg px-3 py-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[#f5ead6]/40">Odometer</span>
      <span className="font-mono text-sm tabular-nums text-amber-glow">{digits} km</span>
    </div>
  );
}
