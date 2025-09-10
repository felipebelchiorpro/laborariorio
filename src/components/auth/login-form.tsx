
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await login(values.password);
      if (result.success) {
        // A lógica de redirecionamento agora é tratada pelo middleware.
        // Apenas atualizamos a página para que o middleware possa fazer seu trabalho.
        router.refresh();
      } else {
        setError("A senha fornecida está incorreta.");
        form.reset();
      }
    });
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha de Acesso</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </Form>
    </>
  );
}
