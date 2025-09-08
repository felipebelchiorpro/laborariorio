"use client";

import * as React from "react";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";
import { toast } from "@/hooks/use-toast";

const parseDate = (dateStr: string) => {
    const [day, month] = dateStr.split('/');
    const year = new Date().getFullYear(); 
    return new Date(`${year}-${month}-${day}`).toISOString();
}

const demoExams: Exam[] = [
    { id: "1", rowNumber: 1, patientName: "Abilio Ignacio Vallejo", receivedDate: parseDate("20/08"), withdrawnBy: "Municipal" },
    { id: "2", rowNumber: 2, patientName: "Adelino da Cruz", receivedDate: parseDate("02/09"), withdrawnBy: "UBS REDENTOR" },
    { id: "3", rowNumber: 3, patientName: "Adilson Carlos de Sousa", receivedDate: parseDate("02/09"), withdrawnBy: "Municipal" },
    { id: "4", rowNumber: 4, patientName: "Adriana Lima de Souza Moreira", receivedDate: parseDate("31/07") },
    { id: "5", rowNumber: 5, patientName: "Adriana de Oliveira Santos Mat", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" },
    { id: "6", rowNumber: 6, patientName: "Adriane Magalhães Costa", receivedDate: parseDate("08/07") },
    { id: "7", rowNumber: 7, patientName: "Adriano Cesar Subeche da Silv", receivedDate: parseDate("05/08"), withdrawnBy: "UBS REDENTOR" },
    { id: "8", rowNumber: 8, patientName: "Adriano Donizete Diniz", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" },
    { id: "9", rowNumber: 9, patientName: "Adrieli Helen de Moraes", receivedDate: parseDate("04/08"), withdrawnBy: "CEAM" },
    { id: "10", rowNumber: 10, patientName: "Adrielle Cippolini Rosseto", receivedDate: parseDate("05/08"), withdrawnBy: "Municipal" },
    { id: "11", rowNumber: 11, patientName: "Adrielle Janaina Diniz Melo", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" },
    { id: "12", rowNumber: 12, patientName: "Afonso Junior do Prado", receivedDate: parseDate("21/08"), withdrawnBy: "UBS REDENTOR" },
    { id: "13", rowNumber: 13, patientName: "Agnaldo Guimaraes do Prado", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" },
    { id: "14", rowNumber: 14, patientName: "Agnaldo Sartori", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" },
    { id: "15", rowNumber: 15, patientName: "Airton Jose Ribeiro", receivedDate: undefined, withdrawnBy: "SANTO ANTONIO" },
    { id: "16", rowNumber: 16, patientName: "Aisla Vitoria dos Reis Longuini", receivedDate: undefined, withdrawnBy: "CEAM" },
    { id: "17", rowNumber: 17, patientName: "Alcidio Francisco Borges", receivedDate: parseDate("08/07") },
    { id: "18", rowNumber: 18, patientName: "Alessandra Magalhaes de Arau", receivedDate: parseDate("18/08"), withdrawnBy: "Municipal" },
    { id: "19", rowNumber: 19, patientName: "Alessandro Donizete do Carmo", receivedDate: parseDate("08/07"), withdrawnBy: "RETIRADO" }
];


export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>(demoExams);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);


  const handleAddOrUpdateExam = async (examData: Omit<Exam, 'id' | 'rowNumber'> & { id?: string }) => {
    toast({
        title: "Ação não permitida",
        description: "A adição ou edição de exames está desabilitada na página de demonstração.",
        variant: "destructive"
    });
  };
  
  const openFormForEdit = (exam: Exam) => {
    setEditingExam(exam);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingExam(null);
    setIsFormOpen(true);
  };

  const columns = getColumns(openFormForEdit);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={exams} 
        onAddPatient={openFormForAdd}
      />
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Editar Detalhes do Exame' : 'Registrar Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <PatientForm 
            exam={editingExam}
            onSubmit={handleAddOrUpdateExam} 
            onDone={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
