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
import type { Exam, ExamDestination } from "@/lib/types"
import { Textarea } from "../ui/textarea"

const examDestinations: ExamDestination[] = ['Laboratório Central', 'Clínica Parceira', 'Centro de Pesquisa', 'São João'];

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  collectionDate: z.date({ required_error: "A data da coleta é obrigatória." }),
  destination: z.enum(examDestinations, { required_error: "O destino do exame é obrigatório."}),
  observations: z.string().optional(),
  receivedDate: z.date().optional(),
  withdrawnBy: z.string().optional(),
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
      observations: "",
      withdrawnBy: "",
    },
  })

  const patientName = form.watch("patientName");
  const isPatientInfoFilled = patientName && patientName.length >= 2;

  function handleSubmit(data: PatientFormValues) {
    const examData: Omit<Exam, 'id'> = {
      ...data,
      collectionDate: data.collectionDate.toISOString(),
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
                  disabled={!isPatientInfoFilled}
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
                <Input placeholder="Nome da pessoa" {...field} disabled={!isPatientInfoFilled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destino do Exame</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {examDestinations.map(dest => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit">Registrar Paciente</Button>
        </div>
      </form>
    </Form>
  )
}
