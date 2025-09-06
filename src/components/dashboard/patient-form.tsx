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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import type { Exam, ExamType, ExamStatus } from "@/lib/types"

const examTypes: ExamType[] = ['Exame de Sangue', 'Urinálise', 'Ressonância Magnética', 'Raio-X', 'Biópsia'];

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  patientId: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "Formato de CPF inválido (xxx.xxx.xxx-xx)." }),
  patientDob: z.date({ required_error: "A data de nascimento é obrigatória." }),
  examType: z.enum(examTypes, { required_error: "O tipo de exame é obrigatório." }),
  collectionDate: z.date({ required_error: "A data da coleta é obrigatória." }),
})

type PatientFormValues = z.infer<typeof formSchema>

interface PatientFormProps {
    onSubmit: (data: Omit<Exam, 'id'>) => void;
    onDone: () => void;
}

export function PatientForm({ onSubmit, onDone }: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientId: "",
    },
  })

  function handleSubmit(data: PatientFormValues) {
    const examData: Omit<Exam, 'id'> = {
      ...data,
      patientDob: data.patientDob.toISOString(),
      collectionDate: data.collectionDate.toISOString(),
      status: 'Pendente' as ExamStatus,
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
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input placeholder="123.456.789-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="patientDob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Nascimento</FormLabel>
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
          name="examType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Exame</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de exame" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {examTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collectionDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Coleta</FormLabel>
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

        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onDone}>Cancelar</Button>
            <Button type="submit">Registrar Paciente</Button>
        </div>
      </form>
    </Form>
  )
}
