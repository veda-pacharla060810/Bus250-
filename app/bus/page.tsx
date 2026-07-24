import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BusOrchestrator from '@/components/bus/BusOrchestrator';

export default async function BusPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiles } = await supabase.from('profiles').select('*');
  const me = profiles?.find((p) => p.id === user.id) ?? null;
  const friend = profiles?.find((p) => p.id !== user.id) ?? null;

  if (!me || !friend) {
    return (
      <main className="flex h-screen items-center justify-center bg-night-950 px-6 text-center text-[#f5ead6]">
        <p>Profiles aren&apos;t seeded yet. Add rows to the `profiles` table for both accounts.</p>
      </main>
    );
  }

  return <BusOrchestrator me={me} friend={friend} />;
}
