'use client';

import ExamTable from '@/components/dashboard/exam-table';
import withAuth from '@/components/auth/with-auth';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const SAO_LUCAS_SHEET_ID = process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID!;

function Home() {
  return (
    <DashboardLayout title="Exames do São Lucas">
      <div className="grid gap-6">
        <ExamTable sheetId={SAO_LUCAS_SHEET_ID} unitName="São Lucas" />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(Home);
