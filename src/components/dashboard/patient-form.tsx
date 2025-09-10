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
import { DatePicker } from "@/components/ui/date-picker"
import type { Exam } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect } from "react"
import { Combobox } from "../ui/combobox"
import { withdrawnByOptions } from "@/lib/data"

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório e deve ter pelo menos 2 caracteres." }),
  observations: z.string().optional(),
  receivedDate: z.date().optional(),
  withdrawnBy: z.string().optional(),
  pdfUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  pdfFile: z
    .custom<FileList>()
    .refine((files) => files === undefined || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo do arquivo é 5MB.`)
    .refine((files) => files === undefined || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), "Apenas arquivos .pdf são aceitos.")
    .optional(),
})

export type PatientFormValues = z.infer<typeof formSchema>

interface PatientFormProps {
    exam?: Exam | null;
    onSubmit: (data: PatientFormValues) => void;
    onDone: () => void;
    isSubmitting?: boolean;
}

export function PatientForm({ exam, onSubmit, onDone, isSubmitting }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      observations: "",
      withdrawnBy: "",
      pdfUrl: "",
    },
  })

  useEffect(() => {
    if (exam) {
      form.reset({
        patientName: exam.patientName,
        observations: exam.observations,
        receivedDate: exam.receivedDate ? new Date(exam.receivedDate) : undefined,
        withdrawnBy: exam.withdrawnBy,
        pdfUrl: exam.pdfUrl,
        pdfFile: undefined,
      });
    } else {
      form.reset({
        patientName: "",
        observations: "",
        receivedDate: new Date(), // Default to today for new exams
        withdrawnBy: "",
        pdfUrl: "",
        pdfFile: undefined,
      });
    }
  }, [exam, form]);

  const pdfFileRef = form.register("pdfFile");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="receivedDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data Recebida</FormLabel>
              <FormControl>
                 <DatePicker 
                  date={field.value}
                  setDate={field.onChange}
                  placeholder="Selecione uma data"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="withdrawnBy"
          render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Retirado Por / Destino</FormLabel>
               <Combobox
                options={withdrawnByOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Selecione ou digite um destino..."
                searchPlaceholder="Buscar destino..."
                notFoundMessage="Destino não encontrado."
                className={isSubmitting ? "pointer-events-none opacity-50" : ""}
              />
              <FormMessage />
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
                  placeholder="Digite observações sobre o exame..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pdfFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anexar PDF</FormLabel>
              <FormControl>
                <Input type="file" accept="application/pdf" {...pdfFileRef} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Anexe um novo PDF aqui. Se um link já existir abaixo, este arquivo o substituirá.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pdfUrl"
          render={({ field }) => (
             exam?.pdfUrl && (
                <FormItem>
                  <FormLabel>Link do PDF (Existente)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                        <Input 
                            placeholder="https://drive.google.com/..." 
                            {...field} 
                            disabled={isSubmitting}
                            readOnly 
                        />
                         <Button 
                            type="button" 
                            variant="secondary"
                            onClick={() => window.open(field.value, '_blank')}
                        >
                            Abrir
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
             )
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (exam ? 'Salvando...' : 'Registrando...') : (exam ? 'Salvar Alterações' : 'Registrar Paciente')}
            </Button>
        </div>
      </form>
    </Form>
  )
}
