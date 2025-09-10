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
import type { Exam, PdfLink } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect, useState } from "react"
import { Combobox } from "../ui/combobox"
import { withdrawnByOptions } from "@/lib/data"
import { Badge } from "../ui/badge"
import { X } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório e deve ter pelo menos 2 caracteres." }),
  observations: z.string().optional(),
  receivedDate: z.date().optional(),
  withdrawnBy: z.string().optional(),
  pdfFiles: z
    .custom<FileList>()
    .refine((files) => {
        if (!files || files.length === 0) return true;
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > MAX_FILE_SIZE) return false;
        }
        return true;
    }, `O tamanho máximo por arquivo é 5MB.`)
    .refine((files) => {
        if (!files || files.length === 0) return true;
        for (let i = 0; i < files.length; i++) {
            if (!ACCEPTED_FILE_TYPES.includes(files[i].type)) return false;
        }
        return true;
    }, "Apenas arquivos .pdf são aceitos.")
    .optional(),
  existingPdfLinks: z.array(z.object({ url: z.string(), name: z.string() })).optional(),
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
      existingPdfLinks: [],
    },
  })

  useEffect(() => {
    if (exam) {
      form.reset({
        patientName: exam.patientName,
        observations: exam.observations,
        receivedDate: exam.receivedDate ? new Date(exam.receivedDate) : undefined,
        withdrawnBy: exam.withdrawnBy,
        pdfFiles: undefined,
        existingPdfLinks: exam.pdfLinks || [],
      });
    } else {
      form.reset({
        patientName: "",
        observations: "",
        receivedDate: new Date(), // Default to today for new exams
        withdrawnBy: "",
        pdfFiles: undefined,
        existingPdfLinks: [],
      });
    }
  }, [exam, form]);

  const pdfFileRef = form.register("pdfFiles");

  const handleRemovePdf = (urlToRemove: string) => {
    const currentPdfs = form.getValues("existingPdfLinks") || [];
    form.setValue("existingPdfLinks", currentPdfs.filter(pdf => pdf.url !== urlToRemove));
  };

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
          name="pdfFiles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anexar Novos PDFs</FormLabel>
              <FormControl>
                <Input type="file" accept="application/pdf" {...pdfFileRef} disabled={isSubmitting} multiple />
              </FormControl>
              <FormDescription>
                Adicione novos arquivos. Para remover um anexo existente, clique no "X" ao lado dele.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="existingPdfLinks"
          render={({ field }) => (
             <FormItem>
                {field.value && field.value.length > 0 && (
                    <FormLabel>PDFs Anexados</FormLabel>
                )}
                <div className="flex flex-wrap gap-2">
                {field.value?.map((pdf, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1 flex items-center gap-1">
                    <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="mr-1 hover:underline">
                        {pdf.name}
                    </a>
                    <button
                        type="button"
                        onClick={() => handleRemovePdf(pdf.url)}
                        className="rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:pointer-events-none"
                        aria-label={`Remover ${pdf.name}`}
                        disabled={isSubmitting}
                    >
                        <X className="h-3 w-3" />
                    </button>
                    </Badge>
                ))}
                </div>
            </FormItem>
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
