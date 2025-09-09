"use client";

import * as React from "react";
import type { Exam } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm } from "./patient-form";
import { addExam, getExams, updateExam, deleteExam, uploadPdfToDrive } from "@/lib/google-api";
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

  const handleAddOrUpdateExam = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
        const pdfFile = formData.get('pdfFile') as File | null;
        let pdfUrl = formData.get('pdfUrl') as string | null;

        if (pdfFile && pdfFile.size > 0) {
            const fileBuffer = Buffer.from(await pdfFile.arrayBuffer());
            pdfUrl = await uploadPdfToDrive(fileBuffer, pdfFile.name);
        }

        const examData = {
          patientName: formData.get('patientName') as string,
          receivedDate: formData.get('receivedDate') as string | undefined,
          withdrawnBy: formData.get('withdrawnBy') as string | undefined,
          observations: formData.get('observations') as string | undefined,
          pdfUrl: pdfUrl || undefined,
        };

        const id = formData.get('id') as string | null;
        if (id) {
            // Update
            const rowNumber = parseInt(formData.get('rowNumber') as string, 10);
            const updatedExam: Exam = { ...examData, id, rowNumber };
            await updateExam(SHEET_ID, updatedExam);
            toast({ title: "Sucesso", description: "Exame atualizado com sucesso." });
        } else {
            // Add new
            await addExam(SHEET_ID, examData);
            toast({ title: "Sucesso", description: "Novo exame registrado com sucesso." });
        }
        
        setIsFormOpen(false);
        fetchExams();
    } catch (error) {
       console.error("Failed to save exam:", error);
       toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o exame. Verifique os dados e a conexão.",
        variant: "destructive"
      })
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (examToDelete: Exam) => {
    try {
      await deleteExam(SHEET_ID, examToDelete.rowNumber);
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

  const columns = getColumns(openFormForEdit, handleDeleteExam);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={exams} 
        onAddPatient={openFormForAdd}
      />
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => !isSubmitting && setIsFormOpen(isOpen)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingExam ? 'Editar Detalhes do Exame' : 'Registrar Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <PatientForm 
            exam={editingExam}
            onSubmit={handleAddOrUpdateExam} 
            onDone={() => setIsFormOpen(false)}
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
