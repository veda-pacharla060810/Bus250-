'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, isSameDay } from 'date-fns';
import type { Profile, Message, Reaction } from '@/lib/types';

const PAGE_SIZE = 30;
const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '🥹'];

export default function ChatDock({ me, friend }: { me: Profile; friend: Profile }) {
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [friendTyping, setFriendTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInitial = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(PAGE_SIZE);
    if (data) {
      setMessages([...data].reverse());
      setHasMore(data.length === PAGE_SIZE);
    }
    const { data: r } = await supabase.from('reactions').select('*');
    if (r) setReactions(r);
  }, [supabase]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        supabase.from('reactions').select('*').then(({ data }) => data && setReactions(data));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'presence' }, (payload) => {
        const row = payload.new as { user_id: string; status: string };
        if (row.user_id === friend.id) setFriendTyping(row.status === 'typing');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, friend.id]);

  useEffect(() => {
    if (!showSearch) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, showSearch]);

  async function loadOlder() {
    if (!messages.length) return;
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (data && data.length) {
      const el = listRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      setMessages((prev) => [...[...data].reverse(), ...prev]);
      setHasMore(data.length === PAGE_SIZE);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } else {
      setHasMore(false);
    }
  }

  function handleScroll() {
    const el = listRef.current;
    if (el && el.scrollTop < 40 && hasMore) loadOlder();
  }

  async function setTyping(status: 'online' | 'typing') {
    await supabase.from('presence').upsert({ user_id: me.id, status, last_seen: new Date().toISOString() });
  }

  function onDraftChange(v: string) {
    setDraft(v);
    setTyping('typing');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping('online'), 1500);
  }

  async function send() {
    if (!draft.trim() && !editing) return;
    if (editing) {
      await supabase.from('messages').update({ body: draft, edited_at: new Date().toISOString() }).eq('id', editing.id);
      setEditing(null);
    } else {
      await supabase.from('messages').insert({ sender_id: me.id, body: draft, reply_to: replyTo?.id ?? null });
      setReplyTo(null);
    }
    setDraft('');
    setTyping('online');
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const existing = reactions.find((r) => r.message_id === messageId && r.user_id === me.id && r.emoji === emoji);
    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert({ message_id: messageId, user_id: me.id, emoji });
    }
  }

  async function deleteMessage(id: string) {
    await supabase.from('messages').update({ deleted: true, body: null }).eq('id', id);
  }

  async function togglePin(m: Message) {
    await supabase.from('messages').update({ pinned: !m.pinned }).eq('id', m.id);
  }

  async function uploadFile(file: File) {
    const path = `${me.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('chat-attachments').upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
    const isImage = file.type.startsWith('image/');
    await supabase.from('messages').insert({
      sender_id: me.id,
      body: null,
      attachment_url: data.publicUrl,
      attachment_type: isImage ? 'image' : 'file',
    });
  }

  const visibleMessages = messages.filter((m) => !m.deleted && (!search || m.body?.toLowerCase().includes(search.toLowerCase())));
  const pinned = messages.filter((m) => m.pinned && !m.deleted);

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="glass-panel absolute bottom-6 right-6 z-30 rounded-full px-4 py-2 text-sm text-amber-glow shadow-xl">
        Open chat
      </button>
    );
  }

  return (
    <div className="glass-panel absolute bottom-0 right-0 z-30 flex h-[70%] w-[380px] max-w-[92vw] flex-col rounded-tl-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#f5ead6]">{friend.display_name}</p>
          <p className="text-[10px] text-[#f5ead6]/40">{friendTyping ? 'typing…' : 'the bus'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSearch((s) => !s)} className="text-xs text-[#f5ead6]/50 hover:text-amber-glow">
            {showSearch ? 'Hide' : 'Search'}
          </button>
          <button onClick={() => setCollapsed(true)} className="text-xs text-[#f5ead6]/50 hover:text-amber-glow">
            Minimize
          </button>
        </div>
      </div>

      {showSearch && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages…"
          className="mx-4 mt-2 rounded-md border border-white/10 bg-night-900/60 px-3 py-1.5 text-xs outline-none focus:border-amber-glow/50"
        />
      )}

      {pinned.length > 0 && (
        <div className="mx-4 mt-2 rounded-md border border-amber-glow/20 bg-amber-glow/5 px-3 py-1.5 text-[11px] text-amber-glow/80">
          📌 {pinned[pinned.length - 1].body ?? 'Pinned attachment'}
        </div>
      )}

      <div ref={listRef} onScroll={handleScroll} className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        {hasMore && <p className="pb-2 text-center text-[10px] text-[#f5ead6]/30">scroll up for more</p>}
        {visibleMessages.map((m, idx) => {
          const prev = visibleMessages[idx - 1];
          const showDate = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
          const mine = m.sender_id === me.id;
          const repliedTo = m.reply_to ? messages.find((x) => x.id === m.reply_to) : null;
          const msgReactions = reactions.filter((r) => r.message_id === m.id);

          return (
            <div key={m.id}>
              {showDate && (
                <div className="my-3 text-center text-[10px] uppercase tracking-wide text-[#f5ead6]/30">
                  {format(new Date(m.created_at), 'EEEE, MMM d')}
                </div>
              )}
              <div className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-amber-glow/20 text-[#f5ead6]' : 'bg-white/5 text-[#f5ead6]'}`}>
                  {repliedTo && (
                    <div className="mb-1 truncate border-l-2 border-amber-glow/40 pl-2 text-[11px] text-[#f5ead6]/50">
                      {repliedTo.body ?? 'attachment'}
                    </div>
                  )}
                  {m.attachment_type === 'image' && m.attachment_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.attachment_url} alt="shared" className="mb-1 max-h-48 rounded-lg" />
                  )}
                  {m.attachment_type === 'file' && m.attachment_url && (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer" className="underline">
                      Download file
                    </a>
                  )}
                  {m.body && <p>{m.body}</p>}
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-[#f5ead6]/30">
                    {format(new Date(m.created_at), 'h:mm a')}
                    {m.edited_at && <span>· edited</span>}
                    {mine && <span>· sent</span>}
                  </div>

                  {msgReactions.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {Object.entries(
                        msgReactions.reduce<Record<string, number>>((acc, r) => {
                          acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => toggleReaction(m.id, emoji)} className="rounded-full bg-white/10 px-1.5 text-[10px]">
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-1 hidden gap-2 text-[10px] text-[#f5ead6]/40 group-hover:flex">
                    {QUICK_REACTIONS.map((e) => (
                      <button key={e} onClick={() => toggleReaction(m.id, e)} className="hover:scale-110">
                        {e}
                      </button>
                    ))}
                    <button onClick={() => setReplyTo(m)} className="hover:text-amber-glow">reply</button>
                    {mine && (
                      <button
                        onClick={() => {
                          setEditing(m);
                          setDraft(m.body ?? '');
                        }}
                        className="hover:text-amber-glow"
                      >
                        edit
                      </button>
                    )}
                    {mine && <button onClick={() => deleteMessage(m.id)} className="hover:text-red-400">delete</button>}
                    <button onClick={() => togglePin(m)} className="hover:text-amber-glow">{m.pinned ? 'unpin' : 'pin'}</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(replyTo || editing) && (
        <div className="mx-4 mb-1 flex items-center justify-between rounded-md bg-white/5 px-3 py-1.5 text-[11px] text-[#f5ead6]/60">
          <span>{editing ? 'Editing message' : `Replying to: ${replyTo?.body ?? 'attachment'}`}</span>
          <button
            onClick={() => {
              setReplyTo(null);
              setEditing(null);
              setDraft('');
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/5 p-3">
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
        <button onClick={() => fileInputRef.current?.click()} className="text-[#f5ead6]/50 hover:text-amber-glow">
          📎
        </button>
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Say something…"
          className="flex-1 rounded-full border border-white/10 bg-night-900/60 px-4 py-2 text-sm outline-none focus:border-amber-glow/50"
        />
        <button onClick={send} className="rounded-full bg-amber-glow/90 px-4 py-2 text-sm font-medium text-night-950 hover:bg-amber-glow">
          {editing ? 'Save' : 'Send'}
        </button>
      </div>
    </div>
  );
}
