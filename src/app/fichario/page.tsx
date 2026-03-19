'use client';

import ExamTable from '@/components/dashboard/exam-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const FICHARIO_SHEET_ID = process.env.NEXT_PUBLIC_FICHARIO_SHEET_ID!;

function FicharioPage() {
  if (!FICHARIO_SHEET_ID) {
    return (
        <DashboardLayout title="Fichário">
            <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-red-200">
                <p className="text-red-500 font-semibold text-lg">
                    Configuração Incompleta
                </p>
                <p className="text-muted-foreground max-w-sm text-center">
                    A variável <code>NEXT_PUBLIC_FICHARIO_SHEET_ID</code> não foi configurada na Vercel ou no arquivo .env.local.
                </p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestão de Fichário">
        <div className="grid gap-6">
            <ExamTable sheetId={FICHARIO_SHEET_ID} unitName="Fichário" hidePdf={true} />
        </div>
    </DashboardLayout>
  );
}

export default withAuth(FicharioPage);
