import { createClient } from '@/lib/supabase/server';
import type { Court } from '@/lib/types';
import { QrPosters } from '@/components/admin/QrPosters';

export const revalidate = 0;

export default async function AdminQr() {
  const supabase = createClient();
  const { data } = await supabase.from('courts').select('*').order('sort_order');

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Codis QR
        </h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Un cartell per pista més un de general. Imprimeix-los i penja’ls al
          pavelló: la gent escaneja i entra directament als horaris, resultats
          en directe i fotos d’aquella pista.
        </p>
      </div>
      <QrPosters courts={(data ?? []) as Court[]} />
    </div>
  );
}
