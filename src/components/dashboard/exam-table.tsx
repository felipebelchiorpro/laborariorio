"use client";

import * as React from "react";
import { exams as initialExams } from "@/lib/data";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>(initialExams);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  const addExam = (newExamData: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...newExamData,
      id: `EXM${(exams.length + 1).toString().padStart(3, '0')}`,
    };
    setExams(prevExams => [newExam, ...prevExams]);
  };

  return (
    <>
      <DataTable 
        columns={columns} 
        data={exams} 
        onAddPatient={() => setIsFormOpen(true)}
      />
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSubmit={addExam} onDone={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
