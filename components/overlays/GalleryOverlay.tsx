'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export default function GalleryOverlay({ me }: { me: Profile }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('gallery_photos').select('*').order('created_at', { ascending: false }).then(({ data }) => data && setPhotos(data));
  }, [supabase]);

  async function upload(file: File) {
    const path = `${me.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file);
    if (error) return;
    const { data: pub } = supabase.storage.from('gallery').getPublicUrl(path);
    const { data } = await supabase.from('gallery_photos').insert({ uploader_id: me.id, url: pub.publicUrl }).select().single();
    if (data) setPhotos((prev) => [data, ...prev]);
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button onClick={() => fileInputRef.current?.click()} className="mb-4 rounded-full bg-amber-glow/90 px-4 py-1.5 text-xs text-night-950">
        Tuck in a new photo
      </button>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.id} src={p.url} alt={p.caption ?? 'photo'} className="aspect-square rounded-lg object-cover" />
        ))}
      </div>
      {photos.length === 0 && <p className="text-sm text-[#f5ead6]/30">Nothing tucked away yet.</p>}
    </div>
  );
}
