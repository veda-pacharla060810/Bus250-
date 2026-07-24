'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { Profile, LoveNote } from '@/lib/types';

export default function LoveNoteProp({ me }: { me: Profile; friend: Profile }) {
  const supabase = createClient();
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    supabase
      .from('love_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setNotes(data);
          setHasUnread(data.some((n) => !n.read && n.author_id !== me.id));
        }
      });

    const channel = supabase
      .channel('love-notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_notes' }, () => {
        supabase
          .from('love_notes')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setNotes(data);
              setHasUnread(data.some((n) => !n.read && n.author_id !== me.id));
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, me.id]);

  async function openNotes() {
    setOpen(true);
    const unreadFromFriend = notes.filter((n) => !n.read && n.author_id !== me.id);
    for (const n of unreadFromFriend) {
      await supabase.from('love_notes').update({ read: true }).eq('id', n.id);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    await supabase.from('love_notes').insert({ author_id: me.id, message: draft.slice(0, 200) });
    setDraft('');
  }

  return (
    <>
      <button
        onClick={openNotes}
        className="relative flex h-10 w-8 items-center justify-center rounded-sm bg-[#e8dcc0] shadow-md transition hover:-translate-y-0.5"
        title="Love notes"
      >
        <div className="absolute inset-1 border border-[#c9b98f]" />
        {hasUnread && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-breathe rounded-full bg-amber-glow" />}
      </button>

      {open && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-night-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-panel relative z-10 flex max-h-[80vh] w-[90vw] max-w-md flex-col rounded-2xl p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#f5ead6]">Notes left on the seat</h3>
              <button onClick={() => setOpen(false)} className="text-xs text-[#f5ead6]/50 hover:text-[#f5ead6]">
                Close
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                maxLength={200}
                placeholder="Leave a little note…"
                className="flex-1 rounded-lg border border-white/10 bg-night-900/60 px-3 py-2 text-sm outline-none focus:border-amber-glow/50"
              />
              <button onClick={send} className="rounded-lg bg-amber-glow/90 px-3 py-2 text-xs text-night-950">
                Leave it
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    n.author_id === me.id ? 'border-amber-glow/20 bg-amber-glow/5 text-[#f5ead6]/80' : 'border-white/10 bg-white/[0.03] text-[#f5ead6]'
                  }`}
                >
                  <p>{n.message}</p>
                  <p className="mt-1 text-[10px] text-[#f5ead6]/30">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-[#f5ead6]/30">No notes yet — leave the first one.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
