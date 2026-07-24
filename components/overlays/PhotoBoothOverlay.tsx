'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { Profile, Polaroid } from '@/lib/types';

export default function PhotoBoothOverlay({ me }: { me: Profile }) {
  const supabase = createClient();
  const [polaroids, setPolaroids] = useState<Polaroid[]>([]);
  const [caption, setCaption] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('polaroids')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setPolaroids(data));
  }, [supabase]);

  function pickFile(file: File) {
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!pendingFile) return;
    const path = `${me.id}/${Date.now()}-${pendingFile.name}`;
    const { error } = await supabase.storage.from('gallery').upload(path, pendingFile);
    if (error) return;
    const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path);
    const { data } = await supabase
      .from('polaroids')
      .insert({ author_id: me.id, url: pub.publicUrl, caption: caption || null })
      .select()
      .single();
    if (data) setPolaroids((prev) => [data, ...prev]);
    setPendingFile(null);
    setPreview(null);
    setCaption('');
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
      />

      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mb-5 w-full rounded-xl border-2 border-dashed border-amber-glow/30 py-6 text-center text-sm text-amber-glow/70 transition hover:border-amber-glow/60 hover:text-amber-glow"
        >
          📸 Snap a moment
        </button>
      ) : (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mx-auto w-48 rotate-[-2deg] bg-white p-3 pb-8 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="aspect-square w-full object-cover" />
            <p className="mt-2 text-center font-serif text-xs text-night-950">{caption || '...'}</p>
          </div>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…"
            className="mt-3 w-full rounded-lg border border-white/10 bg-night-900/60 px-3 py-2 text-sm outline-none focus:border-amber-glow/50"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={save} className="flex-1 rounded-lg bg-amber-glow/90 py-2 text-xs text-night-950">
              Pin it up
            </button>
            <button
              onClick={() => {
                setPendingFile(null);
                setPreview(null);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#f5ead6]/60"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {polaroids.map((p) => (
          <div key={p.id} className="rotate-[-1deg] bg-white p-2 pb-6 shadow-lg transition hover:rotate-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? 'polaroid'} className="aspect-square w-full object-cover" />
            <p className="mt-2 truncate text-center font-serif text-[11px] text-night-950">{p.caption ?? ' '}</p>
            <p className="text-center text-[9px] text-night-950/50">{format(new Date(p.created_at), 'MMM d')}</p>
          </div>
        ))}
      </div>
      {polaroids.length === 0 && !preview && <p className="text-sm text-[#f5ead6]/30">No moments pinned up yet.</p>}
    </div>
  );
}
