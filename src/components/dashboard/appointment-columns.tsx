"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MessageSquare, Check, X, BellRing, Phone } from "lucide-react"
import type { Appointment } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions"
import { Badge } from "../ui/badge"
import { cn, normalizeText } from "@/lib/utils"
import { format } from "date-fns"
import { getStoredWhatsAppTemplate, buildWhatsAppMessage } from "./whatsapp-template-dialog"

export const getColumns = (
  onEdit: (appointment: Appointment) => void,
  onDelete: (appointment: Appointment) => void,
  onToggleNotified: (appointment: Appointment) => void
): ColumnDef<Appointment>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "patientName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Paciente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-foreground">{row.original.patientName}</div>
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id) || '');
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "examDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data do Exame
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const dateStr = row.original.examDate;
      if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;
      try {
        let displayDate = dateStr;
        if (dateStr.includes('-')) {
          const [y, m, d] = dateStr.split('-');
          if (y && m && d) displayDate = `${d}/${m}/${y}`;
        }
        return <span className="font-semibold text-primary">{displayDate}</span>;
      } catch (e) {
        return <span className="font-semibold">{dateStr}</span>;
      }
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone / WhatsApp",
    cell: ({ row }) => {
      const app = row.original;
      const phoneRaw = app.phone || '';
      const digitsOnly = phoneRaw.replace(/\D/g, '');

      const openWhatsApp = () => {
        if (!digitsOnly) return;
        const formattedPhone = digitsOnly.length <= 11 ? `55${digitsOnly}` : digitsOnly;
        const customTemplate = getStoredWhatsAppTemplate();
        const rawMsg = buildWhatsAppMessage(customTemplate, app.patientName, app.examDate);
        const textMessage = encodeURIComponent(rawMsg);
        window.open(`https://wa.me/${formattedPhone}?text=${textMessage}`, '_blank');
      };


      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground/80">{phoneRaw || '—'}</span>
          {digitsOnly ? (
            <Button
              variant="outline"
              size="sm"
              onClick={openWhatsApp}
              className="h-8 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all shadow-sm group"
              title="Mandar mensagem no WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Enviar Msg</span>
            </Button>
          ) : null}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id) || '');
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "notified",
    header: "Contato (Avisado?)",
    cell: ({ row }) => {
      const app = row.original;
      const notified = app.notified;
      return (
        <button
          onClick={() => onToggleNotified(app)}
          className="group focus:outline-none"
          title="Clique para alternar o status de aviso"
        >
          <Badge className={cn(
            "px-2.5 py-1 border shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5",
            notified
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
          )}>
            <BellRing className="h-3 w-3" />
            <span>{notified ? 'Avisado' : 'Não Avisado'}</span>
          </Badge>
        </button>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Presença / Confirmação",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status === 'vai') {
        return (
          <Badge className="px-2.5 py-1 bg-emerald-500 text-white dark:bg-emerald-600 shadow-md shadow-emerald-500/20 font-bold border-0 flex items-center gap-1 w-fit">
            <Check className="h-3.5 w-3.5" />
            <span>Vai Fazer (Confirmado)</span>
          </Badge>
        );
      }
      if (status === 'nao_vai') {
        return (
          <Badge className="px-2.5 py-1 bg-rose-500 text-white dark:bg-rose-600 shadow-md shadow-rose-500/20 font-bold border-0 flex items-center gap-1 w-fit">
            <X className="h-3.5 w-3.5" />
            <span>Não Vai Fazer</span>
          </Badge>
        );
      }
      return (
        <Badge className="px-2.5 py-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30 font-semibold flex items-center gap-1 w-fit">
          <span>Pendente</span>
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const rowStatus = row.getValue(id) as string;
      if (!value) return true;
      return rowStatus === value;
    },
  },
  {
    accessorKey: "observations",
    header: "Observações",
    cell: ({ row }) => {
      const obs = row.original.observations;
      return <div className="max-w-[220px] truncate text-xs text-muted-foreground" title={obs}>{obs || '—'}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onEdit={() => onEdit(row.original)}
        onDelete={() => onDelete(row.original)}
      />
    ),
  },
]
