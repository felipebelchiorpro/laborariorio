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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Check, Sparkles, MessageSquare, Clock, Link as LinkIcon } from "lucide-react";

export const DEFAULT_WHATSAPP_TEMPLATE = `Olá, *{paciente}*! 👋

Aqui é do *Laboratório Municipal de Caconde*.

Você tem um agendamento marcado:
📅 *{data}* (*{dia_da_semana}*)
⏰ Horário de coleta: *{horario}*
🩺 Comparecer em jejum com documento e pedido médico

👇 *Confirme ou desmarque pelo link abaixo:*
{link_confirmacao}`;

export interface WeeklyScheduleConfig {
  segunda: string;
  terca: string;
  quarta: string;
  quinta: string;
  sexta: string;
  sabado: string;
  domingo: string;
}

export const DEFAULT_SCHEDULE_CONFIG: WeeklyScheduleConfig = {
  segunda: "das 07h00 às 08h30",
  terca: "das 07h00 às 08h30",
  quarta: "das 07h00 às 08h30",
  quinta: "das 07h00 às 08h30",
  sexta: "das 07h00 às 08h30",
  sabado: "das 07h00 às 08h00",
  domingo: "Sem coleta (Fechado)",
};

export function getStoredWhatsAppTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_WHATSAPP_TEMPLATE;
  return localStorage.getItem("whatsapp_template") || DEFAULT_WHATSAPP_TEMPLATE;
}

export function saveStoredWhatsAppTemplate(template: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("whatsapp_template", template);
  }
}

export function getStoredScheduleConfig(): WeeklyScheduleConfig {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE_CONFIG;
  try {
    const raw = localStorage.getItem("whatsapp_schedule_config");
    if (raw) return { ...DEFAULT_SCHEDULE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {}
  return DEFAULT_SCHEDULE_CONFIG;
}

export function saveStoredScheduleConfig(config: WeeklyScheduleConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem("whatsapp_schedule_config", JSON.stringify(config));
  }
}

export function getDayOfWeekName(examDateStr: string): string {
  if (!examDateStr) return "";
  let dateObj: Date | null = null;
  if (examDateStr.includes("-")) {
    const [y, m, d] = examDateStr.split("-").map(Number);
    if (y && m && d) dateObj = new Date(y, m - 1, d);
  } else if (examDateStr.includes("/")) {
    const [d, m, y] = examDateStr.split("/").map(Number);
    if (d && m && y) dateObj = new Date(y, m - 1, d);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "";

  const days = [
    "DOMINGO",
    "SEGUNDA-FEIRA",
    "TERÇA-FEIRA",
    "QUARTA-FEIRA",
    "QUINTA-FEIRA",
    "SEXTA-FEIRA",
    "SÁBADO",
  ];
  return days[dateObj.getDay()];
}

export function getScheduleForDate(examDateStr: string, scheduleConfig?: WeeklyScheduleConfig): string {
  const config = scheduleConfig || getStoredScheduleConfig();
  if (!examDateStr) return config.segunda;

  let dateObj: Date | null = null;
  if (examDateStr.includes("-")) {
    const [y, m, d] = examDateStr.split("-").map(Number);
    if (y && m && d) dateObj = new Date(y, m - 1, d);
  } else if (examDateStr.includes("/")) {
    const [d, m, y] = examDateStr.split("/").map(Number);
    if (d && m && y) dateObj = new Date(y, m - 1, d);
  }

  if (!dateObj || isNaN(dateObj.getTime())) return config.segunda;

  const dayIndex = dateObj.getDay();
  switch (dayIndex) {
    case 0: return config.domingo;
    case 1: return config.segunda;
    case 2: return config.terca;
    case 3: return config.quarta;
    case 4: return config.quinta;
    case 5: return config.sexta;
    case 6: return config.sabado;
    default: return config.segunda;
  }
}

export function buildWhatsAppMessage(
  template: string,
  patientName: string,
  examDate: string,
  appointmentId?: string
): string {
  let displayDate = examDate || "";
  if (examDate && examDate.includes("-")) {
    const [y, m, d] = examDate.split("-");
    if (y && m && d) displayDate = `${d}/${m}/${y}`;
  }

  const dayOfWeek = getDayOfWeekName(examDate);
  const horario = getScheduleForDate(examDate);

  // Link de confirmação dinâmico
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://laboratorio-caconde.vercel.app";
  const confirmationLink = appointmentId
    ? `${baseUrl}/confirmar?id=${encodeURIComponent(appointmentId)}`
    : `${baseUrl}/confirmar?id=demo`;

  return template
    .replace(/\{paciente\}/gi, patientName)
    .replace(/\{data\}/gi, displayDate || "indicado")
    .replace(/\{dia_da_semana\}|\{diasemana\}|\{dia\}/gi, dayOfWeek || "")
    .replace(/\{horario\}|\{hora\}/gi, horario || "")
    .replace(/\{link_confirmacao\}|\{link\}|\{linkconfirmacao\}/gi, confirmationLink)
    .replace(/\{laboratorio\}/gi, "Laboratório Municipal de Caconde");
}

interface WhatsAppTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhatsAppTemplateDialog({ open, onOpenChange }: WhatsAppTemplateDialogProps) {
  const [template, setTemplate] = useState<string>(DEFAULT_WHATSAPP_TEMPLATE);
  const [schedule, setSchedule] = useState<WeeklyScheduleConfig>(DEFAULT_SCHEDULE_CONFIG);
  const [activeTab, setActiveTab] = useState<"mensagem" | "horarios">("mensagem");

  useEffect(() => {
    if (open) {
      setTemplate(getStoredWhatsAppTemplate());
      setSchedule(getStoredScheduleConfig());
    }
  }, [open]);

  const handleSave = () => {
    saveStoredWhatsAppTemplate(template);
    saveStoredScheduleConfig(schedule);
    toast({
      title: "Configurações Salvas com Sucesso!",
      description: "O modelo e os horários por dia da semana foram atualizados.",
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    setSchedule(DEFAULT_SCHEDULE_CONFIG);
    saveStoredWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    saveStoredScheduleConfig(DEFAULT_SCHEDULE_CONFIG);
    toast({
      title: "Modelo Restaurado",
      description: "A mensagem e os horários voltaram ao padrão original.",
    });
  };

  const insertVariable = (variableStr: string) => {
    setTemplate((prev) => `${prev} ${variableStr}`);
  };

  const [samplePreview, setSamplePreview] = useState<string>("");

  useEffect(() => {
    setSamplePreview(buildWhatsAppMessage(template, "ALINE RAQUEL PEPE", "2026-11-24", "demo-id"));
  }, [template, schedule]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Configurar Mensagem & Horários de Coleta</DialogTitle>
              <DialogDescription className="text-xs">
                Personalize o modelo de aviso e os horários por dia da semana para o paciente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Abas Alternativas */}
        <div className="flex gap-2 border-b border-border/50 pb-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "mensagem" ? "default" : "outline"}
            onClick={() => setActiveTab("mensagem")}
            className="text-xs h-8"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Modelo da Mensagem
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === "horarios" ? "default" : "outline"}
            onClick={() => setActiveTab("horarios")}
            className="text-xs h-8"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Horários por Dia da Semana
          </Button>
        </div>

        {activeTab === "mensagem" ? (
          <div className="space-y-4 py-1">
            {/* Tag buttons */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Variáveis Dinâmicas (Clique para inserir)
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{paciente}")}
                  className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-0.5"
                >
                  + &#123;paciente&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{data}")}
                  className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-0.5"
                >
                  + &#123;data&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{dia_da_semana}")}
                  className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-0.5"
                >
                  + &#123;dia_da_semana&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{horario}")}
                  className="cursor-pointer bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 text-xs py-0.5"
                >
                  + &#123;horario&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{link_confirmacao}")}
                  className="cursor-pointer bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 text-xs py-0.5"
                >
                  + &#123;link_confirmacao&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("{laboratorio}")}
                  className="cursor-pointer bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 text-xs py-0.5"
                >
                  + &#123;laboratorio&#125;
                </Badge>
                <Badge
                  variant="outline"
                  onClick={() => insertVariable("*texto em negrito*")}
                  className="cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80 text-xs py-0.5 font-mono"
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
                rows={7}
                className="font-sans text-xs resize-none"
                placeholder="Digite a mensagem padrão..."
              />
            </div>

            {/* Live Preview WhatsApp Bubble */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Pré-visualização no WhatsApp
                </label>
              </div>
              <div className="rounded-xl bg-[#0b141a] p-3 border border-emerald-900/30 shadow-inner max-h-48 overflow-y-auto">
                <div className="max-w-[90%] rounded-lg bg-[#005c4b] p-3 text-white text-xs whitespace-pre-wrap leading-relaxed shadow-sm font-sans">
                  {samplePreview}
                  <div className="text-[9px] text-emerald-200/60 text-right mt-1 font-mono">
                    12:00 ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-xs text-muted-foreground">
              Defina o horário de coleta que será preenchido automaticamente pela variável <code>&#123;horario&#125;</code> para cada dia da semana:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Segunda-feira</label>
                <Input
                  value={schedule.segunda}
                  onChange={(e) => setSchedule({ ...schedule, segunda: e.target.value })}
                  placeholder="ex: das 07h00 às 08h30"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Terça-feira</label>
                <Input
                  value={schedule.terca}
                  onChange={(e) => setSchedule({ ...schedule, terca: e.target.value })}
                  placeholder="ex: das 07h00 às 08h30"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Quarta-feira</label>
                <Input
                  value={schedule.quarta}
                  onChange={(e) => setSchedule({ ...schedule, quarta: e.target.value })}
                  placeholder="ex: das 07h00 às 08h30"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Quinta-feira</label>
                <Input
                  value={schedule.quinta}
                  onChange={(e) => setSchedule({ ...schedule, quinta: e.target.value })}
                  placeholder="ex: das 07h00 às 08h30"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Sexta-feira</label>
                <Input
                  value={schedule.sexta}
                  onChange={(e) => setSchedule({ ...schedule, sexta: e.target.value })}
                  placeholder="ex: das 07h00 às 08h30"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Sábado</label>
                <Input
                  value={schedule.sabado}
                  onChange={(e) => setSchedule({ ...schedule, sabado: e.target.value })}
                  placeholder="ex: das 07h00 às 08h00"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-muted-foreground">Domingo</label>
                <Input
                  value={schedule.domingo}
                  onChange={(e) => setSchedule({ ...schedule, domingo: e.target.value })}
                  placeholder="ex: Sem coleta"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
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
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
