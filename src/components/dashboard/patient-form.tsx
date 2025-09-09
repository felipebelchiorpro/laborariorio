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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import type { Exam } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect } from "react"


const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório e deve ter pelo menos 2 caracteres." }),
  observations: z.string().optional(),
  receivedDate: z.date().optional(),
  withdrawnBy: z.string().optional(),
})

type PatientFormValues = z.infer<typeof formSchema>

interface PatientFormProps {
    exam?: Exam | null;
    onSubmit: (data: Omit<Exam, 'id' | 'rowNumber'> & { id?: string }) => void;
    onDone: () => void;
}

export function PatientForm({ exam, onSubmit, onDone }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      observations: "",
      withdrawnBy: "",
    },
  })

  useEffect(() => {
    if (exam) {
      form.reset({
        patientName: exam.patientName,
        observations: exam.observations,
        receivedDate: exam.receivedDate ? new Date(exam.receivedDate) : undefined,
        withdrawnBy: exam.withdrawnBy,
      });
    } else {
      form.reset({
        patientName: "",
        observations: "",
        receivedDate: undefined,
        withdrawnBy: "",
      });
    }
  }, [exam, form]);

  function handleSubmit(data: PatientFormValues) {
    const examData: Omit<Exam, 'id' | 'rowNumber'> & { id?: string } = {
      ...data,
      id: exam?.id,
      receivedDate: data.receivedDate?.toISOString(),
    };
    onSubmit(examData);
    onDone();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Paciente</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
            <FormItem>
              <FormLabel>Retirado Por</FormLabel>
              <FormControl>
                <Input placeholder="Ex: UBS REDENTOR, Municipal..." {...field} />
              </FormControl>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
            <Button type="submit">{exam ? 'Salvar Alterações' : 'Registrar Paciente'}</Button>
        </div>
      </form>
    </Form>
  )
}
