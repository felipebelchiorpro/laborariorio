"use client";

import * as React from "react";
import type { Fosp } from "@/lib/types";
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FospForm, type FospFormValues } from "./fosp-form";
import { getFosps, addFosp, updateFosp, deleteFosp } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";
import { getColumns } from "./fosp-columns";

interface FospTableProps {
    sheetId: string;
    sheetName?: string;
}

export default function FospTable({ sheetId, sheetName = "FOSP" }: FospTableProps) {
  const [fosps, setFosps] = React.useState<Fosp[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingFosp, setEditingFosp] = React.useState<Fosp | null>(null);
  const formRef = React.useRef<{ resetForm: () => void }>(null);

  const fetchFosps = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFosps(sheetId, sheetName);
      setFosps(data);
    } catch (error) {
      console.error("Failed to fetch FOSP items:", error);
      toast({
        title: "Erro ao buscar registros FOSP",
        description: "Não foi possível carregar os dados da planilha.",
        variant: "destructive"
      })
    } finally {
      setLoading(false);
    }
  }, [sheetId, sheetName]);

  React.useEffect(() => {
    fetchFosps();
  }, [fetchFosps]);

  const handleAddOrUpdate = async (values: FospFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingFosp;
    
    try {
      const fospData: Omit<Fosp, 'id' | 'rowNumber'> = {
        patientName: values.patientName,
        sent: values.sent,
        sentDate: values.sentDate,
        receivedBack: values.receivedBack,
        examType: values.examType,
        observations: values.observations,
      };

      if (isEditing) {
        const res = await updateFosp(sheetId, sheetName, { ...editingFosp, ...fospData });
        if (res && res.error) throw new Error(res.error);
        toast({ title: "Sucesso", description: "Registro FOSP atualizado." });
      } else {
        const res = await addFosp(sheetId, sheetName, fospData);
        if (res && res.error) throw new Error(res.error);
        toast({ title: "Sucesso", description: "Novo FOSP registrado." });
      }
      
      fetchFosps();

      if (isEditing) {
        setIsFormOpen(false);
        setEditingFosp(null);
      } else {
        formRef.current?.resetForm();
      }

    } catch (error) {
       const errorMessage = (error instanceof Error) ? error.message : "Ocorreu um erro desconhecido.";
       console.error("Failed to save FOSP item:", error);
       toast({ title: "Erro ao salvar", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        if (isEditing) {
          setEditingFosp(null);
        }
    }
  };

  const handleDelete = async (fospToDelete: Fosp) => {
    try {
      const res = await deleteFosp(sheetId, sheetName, fospToDelete.id);
      if (res && res.error) throw new Error(res.error);
      toast({ title: "Sucesso", description: "Registro FOSP excluído com sucesso." });
      fetchFosps();
    } catch (error: any) {
      console.error("Failed to delete FOSP item:", error);
      toast({ title: "Erro ao excluir", description: error.message || "Não foi possível excluir o item.", variant: "destructive" });
    }
  };
  
  const openFormForEdit = (fosp: Fosp) => {
    setEditingFosp(fosp);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingFosp(null);
    setIsFormOpen(true);
  };
  
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingFosp(null);
    }
  }

  const columns = getColumns(openFormForEdit, handleDelete);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={fosps} 
        onAddPatient={openFormForAdd}
      />
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingFosp ? 'Editar FOSP' : 'Registrar Novo FOSP'}</DialogTitle>
          </DialogHeader>
          <FospForm
            ref={formRef}
            fosp={editingFosp}
            onSubmit={handleAddOrUpdate} 
            onDone={handleCloseDialog}
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
