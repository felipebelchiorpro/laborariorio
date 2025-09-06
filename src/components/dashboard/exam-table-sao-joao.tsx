"use client";

import * as React from "react";
import { exams as initialExams } from "@/lib/data";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>(() => 
    initialExams.filter(exam => exam.destination === 'São João')
  );
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  
  const handleAddOrUpdateExam = (examData: Omit<Exam, 'id'> & { id?: string }) => {
    if (examData.id) {
      // Update existing exam
      const updatedExams = initialExams.map(exam =>
        exam.id === examData.id ? { ...exam, ...examData } : exam
      );
      // This is a mock, so we update the initialExams array
      initialExams.length = 0;
      Array.prototype.push.apply(initialExams, updatedExams);
    } else {
      // Add new exam
      const newExam: Exam = {
        ...examData,
        id: `EXM${(initialExams.length + 1).toString().padStart(3, '0')}`,
      };
      initialExams.push(newExam);
    }
    // Refresh local state
    setExams(initialExams.filter(exam => exam.destination === 'São João'));
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
