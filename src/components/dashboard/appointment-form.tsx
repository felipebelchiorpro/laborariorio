"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Appointment, AppointmentStatus } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect, useImperativeHandle, forwardRef } from "react"
import { Switch } from "../ui/switch"
import { DatePicker } from "../ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório." }),
  examDate: z.string().min(1, { message: "A data do exame é obrigatória." }),
  phone: z.string().optional(),
  notified: z.boolean().default(false),
  status: z.enum(['pendente', 'vai', 'nao_vai']).default('pendente'),
  observations: z.string().optional(),
})

export type AppointmentFormValues = z.infer<typeof formSchema>

interface AppointmentFormProps {
    appointment?: Appointment | null;
    onSubmit: (data: AppointmentFormValues) => void;
    onDone: () => void;
    isSubmitting?: boolean;
}

export const AppointmentForm = forwardRef(({ appointment, onSubmit, onDone, isSubmitting }: AppointmentFormProps, ref) => {
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      examDate: format(new Date(), 'yyyy-MM-dd'),
      phone: "",
      notified: false,
      status: "pendente",
      observations: "",
    },
  })

  const resetForm = () => {
    form.reset({
      patientName: "",
      examDate: format(new Date(), 'yyyy-MM-dd'),
      phone: "",
      notified: false,
      status: "pendente",
      observations: "",
    });
  }

  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  useEffect(() => {
    if (appointment) {
      form.reset({
        patientName: appointment.patientName,
        examDate: appointment.examDate || format(new Date(), 'yyyy-MM-dd'),
        phone: appointment.phone || "",
        notified: appointment.notified || false,
        status: appointment.status || "pendente",
        observations: appointment.observations || "",
      });
    } else {
      resetForm();
    }
  }, [appointment, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="patientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Paciente</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do paciente" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="examDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Exame</FormLabel>
                <DatePicker 
                  date={field.value ? new Date(field.value.includes('T') ? field.value : `${field.value}T12:00:00`) : undefined}
                  setDate={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                  placeholder="Selecione a data"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(19) 99999-9999" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presença / Confirmação</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente (Aguardando)</SelectItem>
                    <SelectItem value="vai">Vai Fazer (Confirmado)</SelectItem>
                    <SelectItem value="nao_vai">Não Vai Fazer (Cancelado)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notified"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[68px] mt-1">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Paciente Avisado?</FormLabel>
                  <FormDescription className="text-[11px]">
                    Confirmar envio de aviso
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Jejum de 8h necessário, acompanhante, motivo se não for..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-3">
            <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (appointment ? 'Salvando...' : 'Registrando...') : (appointment ? 'Salvar Alterações' : 'Registrar Agendamento')}
            </Button>
        </div>
      </form>
    </Form>
  )
});

AppointmentForm.displayName = "AppointmentForm";
