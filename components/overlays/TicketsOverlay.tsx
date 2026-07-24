'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, startOfMonth } from 'date-fns';
import type { Profile } from '@/lib/types';

interface Ticket {
  id: string;
  month: string;
  title: string;
  punched: boolean;
}

export default function TicketsOverlay({ me }: { me: Profile }) {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    supabase.from('tickets').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setTickets(data));
  }, [supabase]);

  async function addTicket() {
    if (!title.trim()) return;
    const { data } = await supabase
      .from('tickets')
      .insert({ month: startOfMonth(new Date()).toISOString().slice(0, 10), title, created_by: me.id })
      .select()
      .single();
    if (data) setTickets((prev) => [data, ...prev]);
    setTitle('');
  }

  async function punch(t: Ticket) {
    await supabase.from('tickets').update({ punched: !t.punched }).eq('id', t.id);
    setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, punched: !x.punched } : x)));
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A plan for this month…"
          className="flex-1 rounded-lg border border-white/10 bg-night-900/60 px-3 py-2 outline-none focus:border-amber-glow/50"
        />
        <button onClick={addTicket} className="rounded-lg bg-amber-glow/90 px-4 py-2 text-xs text-night-950">
          Print ticket
        </button>
      </div>
      <div className="space-y-2">
        {tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => punch(t)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
              t.punched ? 'border-white/5 bg-white/[0.02] text-[#f5ead6]/40 line-through' : 'border-amber-glow/20 bg-amber-glow/5 text-[#f5ead6]'
            }`}
          >
            <span>{t.title}</span>
            <span className="text-[10px] uppercase tracking-wide">
              {format(new Date(t.month), 'MMM yyyy')} · {t.punched ? 'punched' : 'open'}
            </span>
          </button>
        ))}
        {tickets.length === 0 && <p className="text-[#f5ead6]/30">No tickets printed for this month yet.</p>}
      </div>
    </div>
  );
}
