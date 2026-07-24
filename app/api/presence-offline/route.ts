import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const body = await req.text();
  const { user_id } = JSON.parse(body);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ ok: false, reason: 'no service key configured' });

  const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  await supabase.from('presence').update({ status: 'offline', last_seen: new Date().toISOString() }).eq('user_id', user_id);
  return NextResponse.json({ ok: true });
}
