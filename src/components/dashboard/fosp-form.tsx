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
import type { Fosp } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect, useImperativeHandle, forwardRef } from "react"
import { Switch } from "../ui/switch"
import { DatePicker } from "../ui/date-picker"

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório." }),
  sent: z.boolean().default(false),
  sentDate: z.string().optional(),
  receivedBack: z.boolean().default(false),
  examType: z.string().min(1, { message: "O tipo de exame é obrigatório." }),
  observations: z.string().optional(),
})

export type FospFormValues = z.infer<typeof formSchema>

interface FospFormProps {
    fosp?: Fosp | null;
    onSubmit: (data: FospFormValues) => void;
    onDone: () => void;
    isSubmitting?: boolean;
}

export const FospForm = forwardRef(({ fosp, onSubmit, onDone, isSubmitting }: FospFormProps, ref) => {
  const form = useForm<FospFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      sent: false,
      sentDate: "",
      receivedBack: false,
      examType: "",
      observations: "",
    },
  })

  const resetForm = () => {
    form.reset({
      patientName: "",
      sent: false,
      sentDate: "",
      receivedBack: false,
      examType: "",
      observations: "",
    });
  }

  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  useEffect(() => {
    if (fosp) {
      form.reset({
        patientName: fosp.patientName,
        sent: fosp.sent,
        sentDate: fosp.sentDate || "",
        receivedBack: fosp.receivedBack,
        examType: fosp.examType || "",
        observations: fosp.observations || "",
      });
    } else {
      resetForm();
    }
  }, [fosp, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

        <FormField
          control={form.control}
          name="examType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Exame</FormLabel>
              <FormControl>
                <Input placeholder="Digite o tipo de exame (ex: Biópsia, Citologia...)" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Foi Enviado?</FormLabel>
                <FormDescription>
                  Marque se o exame FOSP já foi enviado.
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

        <FormField
          control={form.control}
          name="sentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Envio</FormLabel>
              <DatePicker 
                date={field.value ? new Date(field.value) : undefined}
                setDate={(date) => field.onChange(date ? date.toISOString() : '')}
                placeholder="Selecione a data de envio"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receivedBack"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Recebido de Volta?</FormLabel>
                <FormDescription>
                  Marque se o resultado/exame já retornou.
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

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite observações sobre o FOSP..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (fosp ? 'Salvando...' : 'Registrando...') : (fosp ? 'Salvar Alterações' : 'Registrar')}
            </Button>
        </div>
      </form>
    </Form>
  )
});

FospForm.displayName = "FospForm";
