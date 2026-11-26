import { NextRequest, NextResponse } from "next/server";
import { getAppointments, updateAppointment } from "@/lib/google-api";

const AGENDAMENTO_SHEET_ID =
  process.env.NEXT_PUBLIC_AGENDAMENTO_SHEET_ID ||
  "1OsCAoFjrmZtgKE8FpPjsEhvfpUdV9Sm_fK2T6qZS2Mw";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Identificador de agendamento não fornecido." },
      { status: 400 }
    );
  }

  try {
    const appointments = await getAppointments(AGENDAMENTO_SHEET_ID, "Agendamentos");
    const appointment = appointments.find((a) => a.id === id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado ou link expirado." },
        { status: 404 }
      );
    }

    // Retorna apenas dados públicos essenciais para o paciente (sem expor planilha ou outros pacientes)
    return NextResponse.json({
      id: appointment.id,
      patientName: appointment.patientName,
      examDate: appointment.examDate,
      status: appointment.status,
    });
  } catch (error: any) {
    console.error("[API Confirmar GET Error]", error);
    return NextResponse.json(
      { error: "Erro ao consultar agendamento. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body; // action: 'confirmar' | 'desistir'

    if (!id || (action !== "confirmar" && action !== "desistir")) {
      return NextResponse.json(
        { error: "Dados inválidos para confirmação." },
        { status: 400 }
      );
    }

    const appointments = await getAppointments(AGENDAMENTO_SHEET_ID, "Agendamentos");
    const appointment = appointments.find((a) => a.id === id);

    if (!appointment) {
      return NextResponse.json(
        { error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    // Regra estrita: Se o paciente já cancelou/desistiu, a vaga foi liberada e não é permitido reconfirmar pelo link
    if (appointment.status === "nao_vai") {
      return NextResponse.json(
        { error: "Este agendamento já foi cancelado e a vaga foi liberada. Entre em contato diretamente com o laboratório para novo agendamento." },
        { status: 400 }
      );
    }

    const newStatus = action === "confirmar" ? "vai" : "nao_vai";
    const updated = {
      ...appointment,
      status: newStatus as "vai" | "nao_vai",
      notified: true,
    };

    const result = await updateAppointment(AGENDAMENTO_SHEET_ID, "Agendamentos", updated);

    if (result && "error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      patientName: appointment.patientName,
    });
  } catch (error: any) {
    console.error("[API Confirmar POST Error]", error);
    return NextResponse.json(
      { error: "Falha ao registrar confirmação." },
      { status: 500 }
    );
  }
}
