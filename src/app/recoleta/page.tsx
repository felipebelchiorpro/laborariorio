'use client';

import RecoletaTable from '@/components/dashboard/recoleta-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

function RecoletaPage() {
  return (
    <DashboardLayout title="Gestão de Recoleta">
      <div className="grid gap-6">
        <RecoletaTable />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(RecoletaPage);
