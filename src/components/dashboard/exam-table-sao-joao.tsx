"use client";

import * as React from "react";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";
import { addExam, getExams, updateExam, deleteExam } from "@/lib/sheets";
import { toast } from "@/hooks/use-toast";

const SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID!;

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);

  const fetchExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExams(SHEET_ID);
      setExams(data);
    } catch (error) {
      console.error("Failed to fetch exams for São João:", error);
      toast({
        title: "Erro ao buscar exames",
        description: "Não foi possível carregar os dados da planilha. Tente novamente mais tarde.",
        variant: "destructive"
      })
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleAddOrUpdateExam = async (examData: Omit<Exam, 'id' | 'rowNumber'> & { id?: string }) => {
    try {
      if (editingExam?.id) {
        // Update existing exam
        const updatedExam = { ...editingExam, ...examData };
        await updateExam(SHEET_ID, updatedExam);
        toast({ title: "Sucesso", description: "Exame atualizado com sucesso." });
      } else {
        // Add new exam
        const newExam: Omit<Exam, 'id' | 'rowNumber'> = {
          ...examData,
        };
        await addExam(SHEET_ID, newExam);
        toast({ title: "Sucesso", description: "Novo exame registrado com sucesso." });
      }
      fetchExams(); // Refresh data
    } catch (error) {
       console.error("Failed to save exam for São João:", error);
       toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o exame na planilha.",
        variant: "destructive"
      })
    }
  };

  const handleDeleteExam = async (examToDelete: Exam) => {
    try {
      await deleteExam(SHEET_ID, examToDelete.rowNumber);
      toast({ title: "Sucesso", description: "Exame excluído com sucesso." });
      fetchExams(); // Refresh data
    } catch (error) {
      console.error("Failed to delete exam for São João:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o exame da planilha.",
        variant: "destructive",
      });
    }
  };
  
  const openFormForEdit = (exam: Exam) => {
    setEditingExam(exam);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingExam(null);
    setIsFormOpen(true);
  };

  const columns = getColumns(openFormForEdit, handleDeleteExam);

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
