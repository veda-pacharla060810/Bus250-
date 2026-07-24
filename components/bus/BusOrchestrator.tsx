'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, OverlayKind, PresenceRow, SceneryTheme } from '@/lib/types';
import BusScene from './BusScene';
import ChatDock from './ChatDock';
import AmbientSounds from './AmbientSounds';
import OverlayShell from '../overlays/OverlayShell';
import JournalOverlay from '../overlays/JournalOverlay';
import GalleryOverlay from '../overlays/GalleryOverlay';
import RouteMapOverlay from '../overlays/RouteMapOverlay';
import TicketsOverlay from '../overlays/TicketsOverlay';
import PhotoBoothOverlay from '../overlays/PhotoBoothOverlay';

export default function BusOrchestrator({ me, friend }: { me: Profile; friend: Profile }) {
  const supabase = createClient();
  const [activeOverlay, setActiveOverlay] = useState<OverlayKind>(null);
  const [soundsOpen, setSoundsOpen] = useState(false);
  const [presence, setPresence] = useState<Record<string, PresenceRow>>({});
  const [theme, setTheme] = useState<SceneryTheme>('rainy_city');

  useEffect(() => {
    let cancelled = false;

    async function markOnline() {
      await supabase.from('presence').upsert({
        user_id: me.id,
        status: 'online',
        last_seen: new Date().toISOString(),
      });
    }
    markOnline();
    const heartbeat = setInterval(markOnline, 20000);

    async function loadPresence() {
      const { data } = await supabase.from('presence').select('*');
      if (!cancelled && data) {
        const map: Record<string, PresenceRow> = {};
        data.forEach((row: PresenceRow) => (map[row.user_id] = row));
        setPresence(map);
      }
    }
    loadPresence();

    const channel = supabase
      .channel('presence-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, (payload) => {
        const row = payload.new as PresenceRow;
        if (row?.user_id) setPresence((prev) => ({ ...prev, [row.user_id]: row }));
      })
      .subscribe();

    function markOffline() {
      navigator.sendBeacon &&
        navigator.sendBeacon('/api/presence-offline', JSON.stringify({ user_id: me.id }));
    }
    window.addEventListener('beforeunload', markOffline);

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      supabase.removeChannel(channel);
      window.removeEventListener('beforeunload', markOffline);
    };
  }, [me.id, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadTheme() {
      const { data } = await supabase.from('scenery_state').select('*').eq('id', 1).single();
      if (!cancelled && data) setTheme(data.theme as SceneryTheme);
    }
    loadTheme();

    const channel = supabase
      .channel('scenery-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scenery_state' }, (payload) => {
        setTheme((payload.new as { theme: SceneryTheme }).theme);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const changeTheme = useCallback(
    async (next: SceneryTheme) => {
      setTheme(next);
      await supabase.from('scenery_state').update({ theme: next, updated_at: new Date().toISOString() }).eq('id', 1);
    },
    [supabase]
  );

  const myPresence = presence[me.id];
  const friendPresence = presence[friend.id];

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-night-950">
      <BusScene
        theme={theme}
        onChangeTheme={changeTheme}
        me={me}
        friend={friend}
        myPresence={myPresence}
        friendPresence={friendPresence}
        onOpenOverlay={setActiveOverlay}
        onOpenSounds={() => setSoundsOpen(true)}
      />

      <ChatDock me={me} friend={friend} />

      {soundsOpen && <AmbientSounds onClose={() => setSoundsOpen(false)} />}

      {activeOverlay && (
        <OverlayShell onClose={() => setActiveOverlay(null)} title={overlayTitle(activeOverlay)}>
          {activeOverlay === 'journal' && <JournalOverlay me={me} friend={friend} />}
          {activeOverlay === 'gallery' && <GalleryOverlay me={me} />}
          {activeOverlay === 'routemap' && <RouteMapOverlay theme={theme} onChangeTheme={changeTheme} me={me} />}
          {activeOverlay === 'tickets' && <TicketsOverlay me={me} />}
          {activeOverlay === 'photobooth' && <PhotoBoothOverlay me={me} />}
        </OverlayShell>
      )}
    </main>
  );
}

function overlayTitle(kind: NonNullable<OverlayKind>) {
  return {
    journal: 'Journal',
    gallery: 'Gallery',
    routemap: 'Route Map',
    tickets: 'Monthly Tickets',
    photobooth: 'Photo Booth',
  }[kind];
}
