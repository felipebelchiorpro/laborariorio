"use client";

import * as React from "react";
import { exams as initialExams } from "@/lib/data";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>(() => 
    initialExams.filter(exam => exam.destination === 'São João')
  );
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  const addExam = (newExamData: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...newExamData,
      id: `EXM${(initialExams.length + 1).toString().padStart(3, '0')}`,
    };
    // Note: This adds to the local state, but won't persist across reloads
    // without a proper backend. We also add it to the main list for demo purposes.
    initialExams.push(newExam); 
    if (newExam.destination === 'São João') {
        setExams(prevExams => [newExam, ...prevExams]);
    }
  };

  return (
    <>
      <DataTable 
        columns={columns} 
        data={exams} 
        onAddPatient={() => {
          // TODO: Re-enable when department management is implemented
          // setIsFormOpen(true)
        }}
      />
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Novo Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm onSubmit={addExam} onDone={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
