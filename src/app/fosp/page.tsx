'use client';

import FospTable from '@/components/dashboard/fosp-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const FOSP_SHEET_ID = 
  process.env.NEXT_PUBLIC_FOSP_SHEET_ID || 
  process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID || 
  process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID || 
  process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID || 
  '';

function FospPage() {
  if (!FOSP_SHEET_ID) {
    return (
        <DashboardLayout title="Gestão de FOSP">
            <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-red-200">
                <p className="text-red-500 font-semibold text-lg">
                    Configuração Incompleta
                </p>
                <p className="text-muted-foreground max-w-sm text-center">
                    A variável <code>NEXT_PUBLIC_FOSP_SHEET_ID</code> não foi configurada na Vercel ou no arquivo .env.local.
                </p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestão de FOSP">
      <div className="grid gap-6">
        <FospTable sheetId={FOSP_SHEET_ID} />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(FospPage);
