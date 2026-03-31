'use client';

import ReportGenerator from '@/components/dashboard/report-generator';
import withAuth from '@/components/auth/with-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

const SAO_LUCAS_SHEET_ID = process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID!;
const SAO_JOAO_SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID!;
const RECOLETA_SHEET_ID = process.env.NEXT_PUBLIC_RECOLETA_SHEET_ID!;
const FICHARIO_SHEET_ID = process.env.NEXT_PUBLIC_FICHARIO_SHEET_ID!;

function RelatoriosPage() {
  return (
    <DashboardLayout title="Geração de Relatórios">
      <div className="mt-4">
        <Tabs defaultValue="sao-lucas" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-4 bg-muted/50 p-1">
                <TabsTrigger value="sao-lucas" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all">São Lucas</TabsTrigger>
                <TabsTrigger value="sao-joao" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">São João</TabsTrigger>
                <TabsTrigger value="fichario" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all">Fichário</TabsTrigger>
                <TabsTrigger value="recoleta" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">Recoleta</TabsTrigger>
            </TabsList>
            <TabsContent value="sao-lucas">
                <ReportGenerator sheetId={SAO_LUCAS_SHEET_ID} unitName="São Lucas" reportTitle="Relatório de Exames - São Lucas" />
            </TabsContent>
            <TabsContent value="sao-joao">
                <ReportGenerator sheetId={SAO_JOAO_SHEET_ID} unitName="São João" reportTitle="Relatório de Exames - São João" />
            </TabsContent>
            <TabsContent value="fichario">
                <ReportGenerator sheetId={FICHARIO_SHEET_ID} unitName="Fichário" reportTitle="Relatório de Exames - Fichário" />
            </TabsContent>
            <TabsContent value="recoleta">
                <ReportGenerator sheetId={RECOLETA_SHEET_ID} unitName="Recoleta" reportTitle="Relatório de Exames - Recoleta" />
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(RelatoriosPage);
