'use client';

import ExamTable from '@/components/dashboard/exam-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const SAO_JOAO_SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID!;

function SaoJoaoPage() {
  return (
    <DashboardLayout title="Exames de São João">
      <div className="grid gap-6">
        <ExamTable sheetId={SAO_JOAO_SHEET_ID} unitName="São João" />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(SaoJoaoPage);
