"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import type { Fosp } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions"
import { Badge } from "../ui/badge"
import { cn, normalizeText } from "@/lib/utils"
import { format } from "date-fns"

export const getColumns = (
  onEdit: (fosp: Fosp) => void,
  onDelete: (fosp: Fosp) => void
): ColumnDef<Fosp>[] => [
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
      return <div className="font-medium">{row.original.patientName}</div>
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id));
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "sent",
    header: "Enviado?",
    cell: ({ row }) => {
      const sent = row.original.sent;
      return (
        <Badge className={cn("px-2.5 py-0.5 border shadow-none font-medium", sent ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300" : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200")}>
          {sent ? 'Enviado' : 'Não Enviado'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "sentDate",
    header: "Data de Envio",
    cell: ({ row }) => {
      const sentDate = row.original.sentDate;
      if (!sentDate) return <span className="text-muted-foreground text-xs">—</span>;
      try {
        const formatted = sentDate.includes('T') ? format(new Date(sentDate), 'dd/MM/yyyy') : sentDate;
        return <span className="text-sm font-medium">{formatted}</span>;
      } catch (e) {
        return <span className="text-sm font-medium">{sentDate}</span>;
      }
    },
  },
  {
    accessorKey: "receivedBack",
    header: "Recebido de Volta?",
    cell: ({ row }) => {
      const receivedBack = row.original.receivedBack;
      return (
        <Badge className={cn("px-2.5 py-0.5 border shadow-none font-medium", receivedBack ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300" : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300")}>
          {receivedBack ? 'Recebido' : 'Pendente / Não Recebido'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "examType",
    header: "Tipo de Exame",
    cell: ({ row }) => {
      return <div className="font-medium text-primary/90">{row.original.examType || '—'}</div>
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id) || '');
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "observations",
    header: "Observações",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />,
  },
]
