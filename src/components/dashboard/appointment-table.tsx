"use client";

import * as React from "react";
import type { Appointment } from "@/lib/types";
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm, type AppointmentFormValues } from "./appointment-form";
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";
import { getColumns } from "./appointment-columns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, BellRing, CheckCircle2, XCircle, Users, Settings } from "lucide-react";
import WhatsAppTemplateDialog from "./whatsapp-template-dialog";

interface AppointmentTableProps {
  sheetId: string;
  sheetName?: string;
}

export default function AppointmentTable({ sheetId, sheetName = "Agendamentos" }: AppointmentTableProps) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const formRef = React.useRef<{ resetForm: () => void }>(null);

  const fetchAppointments = React.useCallback(async () => {
    if (!sheetId) return;
    setLoading(true);
    try {
      const data = await getAppointments(sheetId, sheetName);
      setAppointments(data);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast({
        title: "Erro ao buscar agendamentos",
        description: "Não foi possível carregar os dados da planilha. Verifique as configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [sheetId, sheetName]);

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAddOrUpdate = async (values: AppointmentFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingAppointment;
    
    try {
      const appointmentData: Omit<Appointment, 'id' | 'rowNumber'> = {
        patientName: values.patientName,
        examDate: values.examDate,
        phone: values.phone || '',
        notified: values.notified,
        status: values.status,
        observations: values.observations || '',
      };

      if (isEditing) {
        const res = await updateAppointment(sheetId, sheetName, { ...editingAppointment, ...appointmentData });
        if (res && res.error) throw new Error(res.error);
        toast({ title: "Sucesso", description: "Agendamento atualizado com sucesso." });
      } else {
        const res = await addAppointment(sheetId, sheetName, appointmentData);
        if (res && res.error) throw new Error(res.error);
        toast({ title: "Sucesso", description: "Novo agendamento registrado com sucesso." });
      }
      
      fetchAppointments();

      if (isEditing) {
        setIsFormOpen(false);
        setEditingAppointment(null);
      } else {
        formRef.current?.resetForm();
      }

    } catch (error: any) {
       console.error("Failed to save appointment:", error);
       toast({ title: "Erro ao salvar", description: error.message || "Ocorreu um erro ao salvar o agendamento.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
        if (isEditing) {
          setEditingAppointment(null);
        }
    }
  };

  const handleToggleNotified = async (app: Appointment) => {
    try {
      const updated = { ...app, notified: !app.notified };
      const res = await updateAppointment(sheetId, sheetName, updated);
      if (res && res.error) throw new Error(res.error);
      toast({
        title: "Status Atualizado",
        description: `Paciente ${app.patientName} marcado como ${!app.notified ? 'Avisado' : 'Não Avisado'}.`
      });
      fetchAppointments();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", description: error.message || "Falha ao alterar status.", variant: "destructive" });
    }
  };

  const handleDelete = async (appToDelete: Appointment) => {
    try {
      const res = await deleteAppointment(sheetId, sheetName, appToDelete.id);
      if (res && res.error) throw new Error(res.error);
      toast({ title: "Sucesso", description: "Agendamento excluído com sucesso." });
      fetchAppointments();
    } catch (error: any) {
      console.error("Failed to delete appointment:", error);
      toast({ title: "Erro ao excluir", description: error.message || "Não foi possível excluir o item.", variant: "destructive" });
    }
  };

  const openFormForEdit = (app: Appointment) => {
    setEditingAppointment(app);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingAppointment(null);
    setIsFormOpen(true);
  };
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setIsFormOpen(false);
      setEditingAppointment(null);
    }
  };

  const columns = getColumns(openFormForEdit, handleDelete, handleToggleNotified);

  // Stats calculation
  const totalCount = appointments.length;
  const pendingNotificationCount = appointments.filter(a => !a.notified).length;
  const willAttendCount = appointments.filter(a => a.status === 'vai').length;
  const wontAttendCount = appointments.filter(a => a.status === 'nao_vai').length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gestão de Agendamentos</h2>
          <p className="text-xs text-muted-foreground">Cadastre exames agendados, envie mensagens dinâmicas no WhatsApp e controle presenças.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsTemplateDialogOpen(true)}
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-semibold shadow-sm gap-2"
        >
          <Settings className="h-4 w-4" />
          <span>Configurar Mensagem WhatsApp</span>
        </Button>
      </div>

      {/* KPI / Summary Cards ("cards brilhantes") */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Agendamentos */}
        <Card className="relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-md shadow-lg shadow-black/5 hover:border-primary/40 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Agendados</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{totalCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pendentes de Aviso */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-amber-500/5 backdrop-blur-md shadow-lg shadow-amber-500/5 hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-amber-500/20 blur-2xl" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Avisos Pendentes</p>
              <h3 className="text-2xl font-bold tracking-tight text-amber-800 dark:text-amber-300 mt-1">{pendingNotificationCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm">
              <BellRing className="h-6 w-6 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Vai Fazer (Confirmado) */}
        <Card className="relative overflow-hidden border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md shadow-lg shadow-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/20 blur-2xl" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Confirmados (Vai)</p>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200 mt-1">{willAttendCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Não Vai Fazer (Cancelados) */}
        <Card className="relative overflow-hidden border-rose-500/20 bg-rose-500/5 backdrop-blur-md shadow-lg shadow-rose-500/5 hover:border-rose-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-rose-500/20 blur-2xl" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Não Irão Fazer</p>
              <h3 className="text-2xl font-bold tracking-tight text-rose-800 dark:text-rose-300 mt-1">{wontAttendCount}</h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Table */}
      <DataTable 
        columns={columns} 
        data={appointments} 
        onAddPatient={openFormForAdd}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento de Exame'}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm
            ref={formRef}
            appointment={editingAppointment}
            onSubmit={handleAddOrUpdate} 
            onDone={handleCloseDialog}
            isSubmitting={isSubmitting} 
          />
        </DialogContent>
      </Dialog>

      {/* WhatsApp Template Configuration Dialog */}
      <WhatsAppTemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      />
    </div>
  );
}
