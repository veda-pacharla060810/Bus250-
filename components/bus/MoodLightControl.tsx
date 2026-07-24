'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useMoodWarmth() {
  const supabase = createClient();
  const [warmth, setWarmth] = useState(50);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('mood_state')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setWarmth(data.warmth);
      });

    const channel = supabase
      .channel('mood-state-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mood_state' }, (payload) => {
        setWarmth((payload.new as { warmth: number }).warmth);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return warmth;
}

export default function MoodLightControl({ warmth }: { warmth: number }) {
  const supabase = createClient();
  const [local, setLocal] = useState(warmth);

  useEffect(() => setLocal(warmth), [warmth]);

  async function commit(value: number) {
    setLocal(value);
    await supabase.from('mood_state').update({ warmth: value, updated_at: new Date().toISOString() }).eq('id', 1);
  }

  return (
    <div className="glass-panel flex items-center gap-2 rounded-lg px-3 py-1.5">
      <span className="text-xs">💡</span>
      <input
        type="range"
        min={0}
        max={100}
        value={local}
        onChange={(e) => commit(Number(e.target.value))}
        className="h-1 w-20 cursor-pointer accent-amber-glow"
      />
    </div>
  );
}
