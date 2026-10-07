'use client';

import AppointmentTable from '@/components/dashboard/appointment-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const AGENDAMENTO_SHEET_ID = 
  process.env.NEXT_PUBLIC_AGENDAMENTO_SHEET_ID || 
  process.env.NEXT_PUBLIC_FOSP_SHEET_ID || 
  process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID || 
  process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID || 
  process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID || 
  '152u0-Rphsn3q7DFnWTIsOKpvi8n7BEzosSuHQC0uOSA';

function AgendamentosPage() {
  if (!AGENDAMENTO_SHEET_ID) {
    return (
        <DashboardLayout title="Agendamentos & Avisos WhatsApp">
            <div className="flex h-[400px] w-full items-center justify-center flex-col gap-4 bg-muted/20 rounded-xl border-2 border-dashed border-red-200">
                <p className="text-red-500 font-semibold text-lg">
                    Configuração Incompleta
                </p>
                <p className="text-muted-foreground max-w-sm text-center">
                    A variável <code>NEXT_PUBLIC_AGENDAMENTO_SHEET_ID</code> não foi configurada na Vercel ou no arquivo .env.local.
                </p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agendamentos & Avisos WhatsApp">
      <div className="grid gap-6">
        <AppointmentTable sheetId={AGENDAMENTO_SHEET_ID} />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AgendamentosPage);
