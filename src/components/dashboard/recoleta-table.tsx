
"use client";

import * as React from "react";
import type { Recoleta } from "@/lib/types";
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecoletaForm, type RecoletaFormValues } from "./recoleta-form";
import { getRecoletas, addRecoleta, updateRecoleta, deleteRecoleta } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";
import { getColumns } from "./recoleta-columns";

interface RecoletaTableProps {
    sheetId: string;
}

export default function RecoletaTable({ sheetId }: RecoletaTableProps) {
  const [recoletas, setRecoletas] = React.useState<Recoleta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingRecoleta, setEditingRecoleta] = React.useState<Recoleta | null>(null);
  const formRef = React.useRef<{ resetForm: () => void }>(null);

  const fetchRecoletas = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecoletas(sheetId);
      setRecoletas(data);
    } catch (error) {
      console.error("Failed to fetch recoletas:", error);
      toast({
        title: "Erro ao buscar recoletas",
        description: "Não foi possível carregar os dados da planilha. Verifique o ID e tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  React.useEffect(() => {
    fetchRecoletas();
  }, [fetchRecoletas]);

  const handleAddOrUpdate = async (values: RecoletaFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingRecoleta;
    
    try {
      const recoletaData: Omit<Recoleta, 'id' | 'rowNumber'> = {
        patientName: values.patientName,
        ubs: values.ubs,
        notified: values.notified,
        observations: values.observations,
      };

      if (isEditing) {
        await updateRecoleta(sheetId, { ...editingRecoleta, ...recoletaData });
        toast({ title: "Sucesso", description: "Recoleta atualizada com sucesso." });
      } else {
        await addRecoleta(sheetId, recoletaData);
        toast({ title: "Sucesso", description: "Nova recoleta registrada." });
      }
      
      fetchRecoletas();

      if (isEditing) {
        setIsFormOpen(false);
        setEditingRecoleta(null);
      } else {
        formRef.current?.resetForm();
      }

    } catch (error) {
       const errorMessage = (error instanceof Error) ? error.message : "Ocorreu um erro desconhecido.";
       console.error("Failed to save recoleta:", error);
       toast({ title: "Erro ao salvar", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        if (isEditing) {
          setEditingRecoleta(null);
        }
    }
  };

  const handleDelete = async (recoletaToDelete: Recoleta) => {
    try {
      await deleteRecoleta(sheetId, recoletaToDelete.id);
      toast({ title: "Sucesso", description: "Recoleta excluída com sucesso." });
      fetchRecoletas();
    } catch (error) {
      console.error("Failed to delete recoleta:", error);
      toast({ title: "Erro ao excluir", description: "Não foi possível excluir o item da planilha.", variant: "destructive" });
    }
  };
  
  const openFormForEdit = (recoleta: Recoleta) => {
    setEditingRecoleta(recoleta);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingRecoleta(null);
    setIsFormOpen(true);
  };
  
  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingRecoleta(null);
    }
  }

  const columns = getColumns(openFormForEdit, handleDelete);

  return (
    <>
      <DataTable 
        columns={columns} 
        data={recoletas} 
        onAddPatient={openFormForAdd}
      />
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRecoleta ? 'Editar Recoleta' : 'Registrar Nova Recoleta'}</DialogTitle>
          </DialogHeader>
          <RecoletaForm
            ref={formRef}
            recoleta={editingRecoleta}
            onSubmit={handleAddOrUpdate} 
            onDone={handleCloseDialog}
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
