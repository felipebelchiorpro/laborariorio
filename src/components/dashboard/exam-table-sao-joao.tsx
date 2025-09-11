"use client";

import * as React from "react";
import type { Exam, PdfLink } from "@/lib/types";
import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PatientForm, type PatientFormValues } from "./patient-form";
import { addExam, getExams, updateExam, deleteExam, uploadPdfToCloudinary } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";

const SHEET_ID = process.env.NEXT_PUBLIC_SAO_JOAO_SHEET_ID!;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error("Falha ao ler o arquivo como string Base64."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export default function ExamTable() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingExam, setEditingExam] = React.useState<Exam | null>(null);
  const formRef = React.useRef<{ resetForm: () => void }>(null);

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

  const handleAddOrUpdateExam = async (values: PatientFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingExam;
    try {
      let finalPdfLinks: PdfLink[] = values.existingPdfLinks || [];

      // Handle new file uploads
      const newFiles = values.pdfFiles ? Array.from(values.pdfFiles) : [];
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (file) => {
          const base64String = await fileToBase64(file);
          // Use the new Cloudinary upload function
          return uploadPdfToCloudinary(base64String, file.name);
        });
        const uploadedLinks = await Promise.all(uploadPromises);
        finalPdfLinks.push(...uploadedLinks);
      }

      // Prepare Exam Data
      const examData: Partial<Exam> = {
        patientName: values.patientName,
        receivedDate: values.receivedDate?.toISOString(),
        withdrawnBy: values.withdrawnBy,
        observations: values.observations,
        pdfLinks: finalPdfLinks,
      };

      // Add or Update in Google Sheets
      if (isEditing) {
        // Update
        const updatedExam: Exam = { ...editingExam, ...examData };
        await updateExam(SHEET_ID, updatedExam);
        toast({ title: "Sucesso", description: "Exame atualizado com sucesso." });
      } else {
        // Add new
        await addExam(SHEET_ID, examData as Omit<Exam, 'id' | 'rowNumber'>);
        toast({ title: "Sucesso", description: "Novo exame registrado com sucesso." });
      }
      
      fetchExams(); // Refresh data in the background

      if (isEditing) {
        setIsFormOpen(false); // Close dialog only when editing
        setEditingExam(null);
      } else {
        formRef.current?.resetForm(); // Reset form for the next entry
      }
    } catch (error) {
       const errorMessage = (error instanceof Error) ? error.message : "Ocorreu um erro desconhecido.";
       console.error("Failed to save exam for São João:", error);
       toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
        setIsSubmitting(false);
        if (isEditing) {
          setEditingExam(null);
        }
    }
  };

  const handleDeleteExam = async (examToDelete: Exam) => {
    try {
      await deleteExam(SHEET_ID, examToDelete.id);
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
            ref={formRef}
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
