"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Settings, RotateCcw, Check, Sparkles, MessageSquare } from "lucide-react";

export const DEFAULT_WHATSAPP_TEMPLATE = `Olá *{paciente}*, tudo bem? Aqui é do *Laboratório Municipal de Caconde*.

Lembramos do seu exame agendado para o dia *{data}*.

Por favor, confirme se você irá comparecer ou se precisa remarcar.`;

export function getStoredWhatsAppTemplate(): string {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_TEMPLATE;
  return localStorage.getItem('whatsapp_template') || DEFAULT_WHATSAPP_TEMPLATE;
}

export function saveStoredWhatsAppTemplate(template: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('whatsapp_template', template);
  }
}

export function buildWhatsAppMessage(template: string, patientName: string, examDate: string): string {
  let displayDate = examDate || '';
  if (examDate && examDate.includes('-')) {
    const [y, m, d] = examDate.split('-');
    if (y && m && d) displayDate = `${d}/${m}/${y}`;
  }

  return template
    .replace(/\{paciente\}/gi, patientName)
    .replace(/\{data\}/gi, displayDate || 'indicado')
    .replace(/\{laboratorio\}/gi, 'Laboratório Municipal de Caconde');
}

interface WhatsAppTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppTemplateDialog({ open, onOpenChange }: WhatsAppTemplateDialogProps) {
  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);

  useEffect(() => {
    if (open) {
      setTemplate(getStoredWhatsAppTemplate());
    }
  }, [open]);

  const handleSave = () => {
    saveStoredWhatsAppTemplate(template);
    toast({
      title: "Modelo Salvo com Sucesso!",
      description: "As próximas mensagens do WhatsApp usarão o novo modelo configurado.",
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    saveStoredWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    toast({
      title: "Modelo Restaurado",
      description: "A mensagem do WhatsApp voltou ao padrão original.",
    });
  };

  const insertVariable = (variableStr: string) => {
    setTemplate((prev) => `${prev} ${variableStr}`);
  };

  const samplePreview = buildWhatsAppMessage(template, "Felipe Augusto", "2026-10-20");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Configurar Mensagem do WhatsApp</DialogTitle>
              <DialogDescription className="text-xs">
                Personalize o modelo padrão enviado aos pacientes com exames agendados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tag buttons */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Variáveis Dinâmicas (Clique para inserir)
            </label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                onClick={() => insertVariable("{paciente}")}
                className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-1"
              >
                + &#123;paciente&#125;
              </Badge>
              <Badge
                variant="outline"
                onClick={() => insertVariable("{data}")}
                className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-1"
              >
                + &#123;data&#125;
              </Badge>
              <Badge
                variant="outline"
                onClick={() => insertVariable("{laboratorio}")}
                className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-1"
              >
                + &#123;laboratorio&#125;
              </Badge>
              <Badge
                variant="outline"
                onClick={() => insertVariable("*texto em negrito*")}
                className="cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80 text-xs py-1 font-mono"
              >
                *negrito*
              </Badge>
            </div>
          </div>

          {/* Textarea Template Editor */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Modelo da Mensagem
            </label>
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={5}
              className="font-sans text-sm resize-none"
              placeholder="Digite a mensagem padrão..."
            />
          </div>

          {/* Live Preview WhatsApp Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Pré-visualização ao vivo no WhatsApp
              </label>
            </div>
            <div className="rounded-xl bg-[#0b141a] p-3 border border-emerald-900/30 shadow-inner">
              <div className="max-w-[85%] rounded-lg bg-[#005c4b] p-3 text-white text-xs whitespace-pre-wrap leading-relaxed shadow-sm font-sans">
                {samplePreview}
                <div className="text-[9px] text-emerald-200/60 text-right mt-1 font-mono">
                  12:00 ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-red-500"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restaurar Padrão
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              <Check className="h-4 w-4 mr-1" />
              Salvar Modelo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
