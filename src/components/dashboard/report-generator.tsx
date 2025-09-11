
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { getExams } from '@/lib/google-api';
import type { Exam } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { withdrawnByOptions } from '@/lib/data';
import { addDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ptBR } from 'date-fns/locale';

interface ReportGeneratorProps {
  sheetId: string;
  reportTitle: string;
}

export default function ReportGenerator({ sheetId, reportTitle }: ReportGeneratorProps) {
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [withdrawnBy, setWithdrawnBy] = useState<string>('');

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExams(sheetId);
      setAllExams(data);
    } catch (error) {
      toast({
        title: 'Erro ao buscar exames',
        description: 'Não foi possível carregar os dados para o relatório.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const applyFilters = useCallback(() => {
    let exams = allExams;

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
       exams = exams.filter(exam => {
         if (!exam.receivedDate) return false;
         const examDate = new Date(exam.receivedDate);
         return examDate >= dateRange.from! && examDate <= dateRange.to!;
       });
    }

    // Filter by withdrawnBy
    if (withdrawnBy && withdrawnBy !== 'todos') {
      exams = exams.filter(exam => exam.withdrawnBy?.toLowerCase() === withdrawnBy.toLowerCase());
    }
    
    // Sort by date
    exams.sort((a, b) => {
        const dateA = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
        const dateB = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
        return dateB - dateA;
    });

    setFilteredExams(exams);
  }, [allExams, dateRange, withdrawnBy]);
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const generatePdf = () => {
    if (filteredExams.length === 0) {
      toast({
        title: "Nenhum dado para gerar",
        description: "Não há exames que correspondam aos filtros selecionados.",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(11);
    const dateFrom = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A';
    const dateTo = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A';
    doc.text(`Período: ${dateFrom} a ${dateTo}`, 14, 30);
    doc.text(`Setor: ${withdrawnByOptions.find(opt => opt.value === withdrawnBy)?.label || 'Todos'}`, 14, 36);


    // Table
    autoTable(doc, {
      startY: 50,
      head: [['Paciente', 'Data Recebida', 'Retirado Por / Destino']],
      body: filteredExams.map(exam => [
        exam.patientName,
        exam.receivedDate ? format(new Date(exam.receivedDate), 'dd/MM/yyyy') : 'N/A',
        exam.withdrawnBy || '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, doc.internal.pageSize.getHeight() - 10);
    }
    
    const fileName = `${reportTitle}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };
  
  const allWithdrawnByOptions = [{ value: 'todos', label: 'Todos os Setores' }, ...withdrawnByOptions];

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Filtrar Relatório</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Período</label>
                 <DatePicker 
                    date={dateRange?.from} 
                    setDate={(date) => setDateRange({ from: date, to: dateRange?.to })}
                    placeholder='Data de Início'
                />
                 <DatePicker 
                    date={dateRange?.to}
                    setDate={(date) => setDateRange({ from: dateRange?.from, to: date })}
                    placeholder='Data Final'
                />
            </div>
            <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Setor / Destino</label>
                <Combobox
                    options={allWithdrawnByOptions}
                    value={withdrawnBy}
                    onChange={setWithdrawnBy}
                    placeholder="Selecione um setor"
                />
            </div>
        </div>
        <div className="flex justify-end pt-4">
            <Button onClick={generatePdf} disabled={loading || filteredExams.length === 0}>
                {loading ? 'Carregando Dados...' : `Gerar PDF (${filteredExams.length} registros)`}
            </Button>
        </div>
    </div>
  );
}
