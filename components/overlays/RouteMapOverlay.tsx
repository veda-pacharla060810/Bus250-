'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SceneryTheme, Profile, BusStop } from '@/lib/types';

const OPTIONS: { key: SceneryTheme; label: string; emoji: string }[] = [
  { key: 'rainy_city', label: 'Rainy City', emoji: '🌧️' },
  { key: 'countryside', label: 'Countryside', emoji: '🌾' },
  { key: 'bridge', label: 'Bridge', emoji: '🌉' },
  { key: 'forest', label: 'Forest', emoji: '🌲' },
  { key: 'sunset_highway', label: 'Sunset Highway', emoji: '🌇' },
  { key: 'snow', label: 'Snow', emoji: '❄️' },
];

export default function RouteMapOverlay({
  theme,
  onChangeTheme,
  me,
}: {
  theme: SceneryTheme;
  onChangeTheme: (t: SceneryTheme) => void;
  me: Profile;
}) {
  const supabase = createClient();
  const [stops, setStops] = useState<BusStop[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    supabase
      .from('bus_stops')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setStops(data));

    const channel = supabase
      .channel('bus-stops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_stops' }, () => {
        supabase
          .from('bus_stops')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => data && setStops(data));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function addStop() {
    if (!draft.trim()) return;
    await supabase.from('bus_stops').insert({ name: draft.trim(), set_by: me.id });
    setDraft('');
  }

  async function toggleReached(s: BusStop) {
    await supabase.from('bus_stops').update({ reached: !s.reached }).eq('id', s.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-4 text-sm text-[#f5ead6]/60">Pick where the bus is driving through tonight.</p>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onChangeTheme(o.key)}
              className={`rounded-xl border p-4 text-left transition ${
                theme === o.key ? 'border-amber-glow/60 bg-amber-glow/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className="mb-1 text-xl">{o.emoji}</div>
              <p className="text-sm text-[#f5ead6]">{o.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-[#f5ead6]/60">Name a destination for this journey.</p>
        <div className="mb-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStop()}
            placeholder="e.g. Our third anniversary"
            className="flex-1 rounded-lg border border-white/10 bg-night-900/60 px-3 py-2 text-sm outline-none focus:border-amber-glow/50"
          />
          <button onClick={addStop} className="rounded-lg bg-amber-glow/90 px-4 py-2 text-xs text-night-950">
            Add stop
          </button>
        </div>
        <div className="space-y-2">
          {stops.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleReached(s)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                s.reached
                  ? 'border-white/5 bg-white/[0.02] text-[#f5ead6]/40 line-through'
                  : 'border-amber-glow/20 bg-amber-glow/5 text-[#f5ead6]'
              }`}
            >
              <span>🚏 {s.name}</span>
              <span className="text-[10px] uppercase tracking-wide">{s.reached ? 'reached' : 'ahead'}</span>
            </button>
          ))}
          {stops.length === 0 && <p className="text-sm text-[#f5ead6]/30">No stops named yet.</p>}
        </div>
      </div>
    </div>
  );
}
