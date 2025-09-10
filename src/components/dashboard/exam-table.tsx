"use client";

import * as React from "react";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm, type PatientFormValues } from "./patient-form";
import { addExam, getExams, updateExam, deleteExam } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";

const SHEET_ID = process.env.NEXT_PUBLIC_SAO_LUCAS_SHEET_ID!;

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);

  const fetchExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExams(SHEET_ID);
      setExams(data);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
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

  const handleAddOrUpdateExam = async (values: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      let newPdfLinks = editingExam?.pdfLinks ? [...editingExam.pdfLinks] : [];

      // 1. Handle PDF Uploads if new files are provided
      const pdfFiles = values.pdfFiles;
      if (pdfFiles && pdfFiles.length > 0) {
        newPdfLinks = []; // Replace existing PDFs if new ones are uploaded
        const formData = new FormData();
        Array.from(pdfFiles).forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha no upload do PDF.');
        }

        const uploadedLinks = await response.json();
        newPdfLinks.push(...uploadedLinks);
      }

      // 2. Prepare Exam Data
      const examData: Partial<Exam> = {
        patientName: values.patientName,
        receivedDate: values.receivedDate?.toISOString(),
        withdrawnBy: values.withdrawnBy,
        observations: values.observations,
        pdfLinks: newPdfLinks,
      };

      // 3. Add or Update in Google Sheets
      if (editingExam) {
        // Update
        const updatedExam: Exam = { ...editingExam, ...examData };
        await updateExam(SHEET_ID, updatedExam);
        toast({ title: "Sucesso", description: "Exame atualizado com sucesso." });
      } else {
        // Add new
        await addExam(SHEET_ID, examData as Omit<Exam, 'id'>);
        toast({ title: "Sucesso", description: "Novo exame registrado com sucesso." });
      }
      
      setIsFormOpen(false);
      fetchExams();
    } catch (error) {
       const errorMessage = (error instanceof Error) ? error.message : "Ocorreu um erro desconhecido.";
       console.error("Failed to save exam:", error);
       toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
        setIsSubmitting(false);
        setEditingExam(null);
    }
  };

  const handleDeleteExam = async (examToDelete: Exam) => {
    try {
      await deleteExam(SHEET_ID, examToDelete.id);
      toast({ title: "Sucesso", description: "Exame excluído com sucesso." });
      fetchExams(); // Refresh data
    } catch (error) {
      console.error("Failed to delete exam:", error);
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
  
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingExam(null);
    }
  }

  const columns = getColumns(openFormForEdit, handleDeleteExam);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={exams} 
        onAddPatient={openFormForAdd}
      />
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Editar Detalhes do Exame' : 'Registrar Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <PatientForm 
            exam={editingExam}
            onSubmit={handleAddOrUpdateExam} 
            onDone={handleCloseDialog}
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
