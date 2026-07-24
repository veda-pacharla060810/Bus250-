'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { Profile } from '@/lib/types';

interface Entry {
  id: string;
  author_id: string;
  body: string;
  mood: string | null;
  created_at: string;
}

const MOODS = ['🙂', '🥹', '😌', '🥱', '😤', '🌧️'];

export default function JournalOverlay({ me }: { me: Profile; friend: Profile }) {
  const supabase = createClient();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [body, setBody] = useState('');
  const [mood, setMood] = useState(MOODS[0]);

  useEffect(() => {
    supabase.from('journal_entries').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setEntries(data));
  }, [supabase]);

  async function addEntry() {
    if (!body.trim()) return;
    const { data } = await supabase.from('journal_entries').insert({ author_id: me.id, body, mood }).select().single();
    if (data) setEntries((prev) => [data, ...prev]);
    setBody('');
  }

  return (
    <div className="space-y-4 text-sm text-[#f5ead6]">
      <div className="rounded-lg border border-white/10 p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write today's page…"
          className="h-24 w-full resize-none bg-transparent outline-none placeholder:text-[#f5ead6]/30"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {MOODS.map((m) => (
              <button key={m} onClick={() => setMood(m)} className={`rounded-full px-1.5 ${mood === m ? 'bg-amber-glow/20' : ''}`}>
                {m}
              </button>
            ))}
          </div>
          <button onClick={addEntry} className="rounded-full bg-amber-glow/90 px-4 py-1.5 text-xs text-night-950">
            Save entry
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-[#f5ead6]/40">
              <span>{format(new Date(e.created_at), 'MMM d, yyyy · h:mm a')}</span>
              <span>{e.mood}</span>
            </div>
            <p className="whitespace-pre-wrap">{e.body}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-[#f5ead6]/30">No pages yet.</p>}
      </div>
    </div>
  );
}
