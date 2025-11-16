
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
import type { Recoleta } from "@/lib/types"
import { Textarea } from "../ui/textarea"
import { useEffect, useImperativeHandle, forwardRef } from "react"
import { Combobox } from "../ui/combobox"
import { withdrawnByOptions } from "@/lib/data"
import { Switch } from "../ui/switch"

const formSchema = z.object({
  patientName: z.string().min(2, { message: "O nome do paciente é obrigatório." }),
  ubs: z.string().min(1, { message: "A UBS de destino é obrigatória." }),
  notified: z.boolean().default(false),
  observations: z.string().optional(),
})

export type RecoletaFormValues = z.infer<typeof formSchema>

interface RecoletaFormProps {
    recoleta?: Recoleta | null;
    onSubmit: (data: RecoletaFormValues) => void;
    onDone: () => void;
    isSubmitting?: boolean;
}

export const RecoletaForm = forwardRef(({ recoleta, onSubmit, onDone, isSubmitting }: RecoletaFormProps, ref) => {
  const form = useForm<RecoletaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      ubs: "",
      notified: false,
      observations: "",
    },
  })

  const resetForm = () => {
    form.reset({
      patientName: "",
      ubs: "",
      notified: false,
      observations: "",
    });
  }

  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  useEffect(() => {
    if (recoleta) {
      form.reset({
        patientName: recoleta.patientName,
        ubs: recoleta.ubs,
        notified: recoleta.notified,
        observations: recoleta.observations,
      });
    } else {
      resetForm();
    }
  }, [recoleta, form]);

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
          name="ubs"
          render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>UBS / Destino</FormLabel>
               <Combobox
                options={withdrawnByOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Selecione a UBS..."
                searchPlaceholder="Buscar UBS..."
                notFoundMessage="UBS não encontrada."
                className={isSubmitting ? "pointer-events-none opacity-50" : ""}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notified"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Paciente Avisado?</FormLabel>
                <FormDescription>
                  Marque se a notificação sobre a recoleta já foi feita.
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
                  placeholder="Digite observações sobre a recoleta..."
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
                {isSubmitting ? (recoleta ? 'Salvando...' : 'Registrando...') : (recoleta ? 'Salvar Alterações' : 'Registrar')}
            </Button>
        </div>
      </form>
    </Form>
  )
});

RecoletaForm.displayName = "RecoletaForm";
