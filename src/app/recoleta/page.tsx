'use client';

import RecoletaTable from '@/components/dashboard/recoleta-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const RECOLETA_SHEET_ID = process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID!;

function RecoletaPage() {
  if (!RECOLETA_SHEET_ID) {
    return (
        <DashboardLayout title="Gestão de Recoleta">
            <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-red-200">
                <p className="text-red-500 font-semibold text-lg">
                    Configuração Incompleta
                </p>
                <p className="text-muted-foreground max-w-sm text-center">
                    A variável <code>NEXT_PUBLIC_RECOLETA_SHEET_ID</code> não foi configurada na Vercel ou no arquivo .env.local.
                </p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestão de Recoleta">
      <div className="grid gap-6">
        <RecoletaTable sheetId={RECOLETA_SHEET_ID} />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(RecoletaPage);
