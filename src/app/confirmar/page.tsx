"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, Calendar, Clock, AlertCircle, Building2, Stethoscope, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AppointmentInfo {
  id: string;
  patientName: string;
  examDate: string;
  status: "pendente" | "vai" | "nao_vai";
}

function ConfirmarContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"vai" | "nao_vai" | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Link de confirmação inválido ou incompleto.");
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const res = await fetch(`/api/confirmar?id=${encodeURIComponent(id!)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Agendamento não encontrado.");
        } else {
          setAppointment(data);
          if (data.status === "vai" || data.status === "nao_vai") {
            setFeedbackStatus(data.status);
          }
        }
      } catch (e) {
        setError("Não foi possível carregar os dados. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleAction = async (action: "confirmar" | "desistir") => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ocorreu um erro ao atualizar.");
      } else {
        setFeedbackStatus(data.status);
        if (appointment) {
          setAppointment({ ...appointment, status: data.status });
        }
      }
    } catch (e) {
      alert("Erro de conexão ao enviar resposta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Formatar data para exibição
  let formattedDate = "—";
  let dayOfWeekName = "";
  if (appointment?.examDate) {
    let dateObj: Date | null = null;
    if (appointment.examDate.includes("-")) {
      const [y, m, d] = appointment.examDate.split("-").map(Number);
      if (y && m && d) dateObj = new Date(y, m - 1, d);
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      const days = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
      dayOfWeekName = days[dateObj.getDay()];
      formattedDate = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } else {
      formattedDate = appointment.examDate;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Card Principal */}
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md">
          {/* Header com Logo da Prefeitura */}
          <div className="bg-slate-950/80 p-6 flex flex-col items-center justify-center border-b border-slate-800/80 text-center relative">
            <div className="relative w-28 h-28 p-2 bg-white rounded-2xl shadow-md mb-2 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src="/logoprefeitura.png"
                  alt="Brasão de Caconde"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-base font-bold tracking-tight text-white uppercase mt-2">
              Prefeitura de Caconde
            </h1>
            <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase flex items-center justify-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5" />
              Laboratório Municipal de Caconde
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Buscando agendamento seguro...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-rose-300">Link Não Disponível</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {error}
                </p>
              </div>
            ) : appointment ? (
              <>
                {/* Saudação do Paciente */}
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Paciente Agendado
                  </span>
                  <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
                    {appointment.patientName}
                  </h2>
                </div>

                {/* Detalhes do Exame */}
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Data da Coleta</span>
                      <strong className="text-slate-200 text-sm">
                        {formattedDate} {dayOfWeekName ? `(${dayOfWeekName})` : ""}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Procedimento</span>
                      <strong className="text-slate-200 text-sm">Coleta de Exames Laboratoriais</strong>
                    </div>
                  </div>
                </div>

                {/* Bloco de Confirmação ou Feedback */}
                {feedbackStatus === "vai" ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold text-emerald-300 uppercase">Presença Confirmada!</h3>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      Sua presença foi confirmada com sucesso! Sua vaga está garantida. Aguardamos você!
                    </p>
                    <div className="pt-2 border-t border-emerald-500/20">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("desistir")}
                        disabled={submitting}
                        className="w-full text-xs border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors py-2 h-auto"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Teve um imprevisto? Clique aqui para informar que NÃO PODERÁ ir
                      </Button>
                    </div>
                  </div>
                ) : feedbackStatus === "nao_vai" ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center space-y-3">
                    <XCircle className="w-10 h-10 text-rose-400 mx-auto" />
                    <h3 className="text-sm font-bold text-rose-300 uppercase">Vaga Liberada / Cancelada</h3>
                    <p className="text-xs text-rose-200/90 leading-relaxed">
                      Você informou que não poderá comparecer. Seu cancelamento foi registrado com sucesso e a vaga foi liberada para outro paciente da fila.
                    </p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Caso precise realizar o exame futuramente, por favor procure o laboratório para um novo agendamento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-xs text-slate-300 font-medium">
                      Você comparecerá à coleta no dia agendado?
                    </p>

                    <div className="space-y-2.5">
                      <Button
                        onClick={() => handleAction("confirmar")}
                        disabled={submitting}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>SIM, VOU COMPARECER</span>
                      </Button>

                      <Button
                        onClick={() => handleAction("desistir")}
                        disabled={submitting}
                        variant="outline"
                        className="w-full h-11 rounded-xl border-slate-700 bg-slate-900/50 hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-semibold text-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        NÃO PODEREI IR (LIBERAR VAGA)
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Rodapé de Segurança e Créditos */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Canal Oficial Seguro • Laboratório Municipal de Caconde
          </p>
          <p className="text-[9px] text-slate-500">
            Prefeitura Municipal da Estância Climática de Caconde - SP
          </p>
          <p className="text-[9px] text-slate-400/80 pt-1 font-medium">
            Desenvolvido por <strong className="text-slate-300">Krona Orbit</strong>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Carregando confirmação...
        </div>
      }
    >
      <ConfirmarContent />
    </Suspense>
  );
}
