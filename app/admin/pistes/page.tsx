import { createClient } from '@/lib/supabase/server';
import type { Court } from '@/lib/types';
import { CourtsAdmin } from '@/components/admin/CourtsAdmin';

export const revalidate = 0;

export default async function AdminCourts() {
  const supabase = createClient();
  const { data } = await supabase.from('courts').select('*').order('sort_order');

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Pistes
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Cada pista té la seva pàgina pública i el seu codi QR.
      </p>
      <div className="mt-5">
        <CourtsAdmin courts={(data ?? []) as Court[]} />
      </div>
    </div>
  );
}
