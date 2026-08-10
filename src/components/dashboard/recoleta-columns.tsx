
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Recoleta } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";
import { Badge } from "../ui/badge";
import { cn, normalizeText } from "@/lib/utils";

export const getColumns = (
  onEdit: (recoleta: Recoleta) => void,
  onDelete: (recoleta: Recoleta) => void
): ColumnDef<Recoleta>[] => [
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
    accessorKey: "ubs",
    header: "UBS / Destino",
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id));
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "tubeColor",
    header: "Cor do Tubo",
    cell: ({ row }) => {
      const tubeColor = row.original.tubeColor;
      if (!tubeColor) return <span className="text-muted-foreground text-xs">—</span>;
      
      const lower = tubeColor.toLowerCase();
      let badgeStyle = "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-200";
      if (lower.includes("vermelho")) badgeStyle = "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 font-medium";
      else if (lower.includes("roxo") || lower.includes("roxa") || lower.includes("edta")) badgeStyle = "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 font-medium";
      else if (lower.includes("azul") || lower.includes("citrato")) badgeStyle = "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300 font-medium";
      else if (lower.includes("cinza") || lower.includes("fluoreto")) badgeStyle = "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300 font-medium";
      else if (lower.includes("verde") || lower.includes("heparina")) badgeStyle = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 font-medium";
      else if (lower.includes("amarelo") || lower.includes("gel")) badgeStyle = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 font-medium";

      return (
        <Badge variant="outline" className={cn("px-2.5 py-0.5 border shadow-none", badgeStyle)}>
          {tubeColor}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id) || '');
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "notified",
    header: "Avisado",
    cell: ({ row }) => {
      const notified = row.original.notified;
      return (
        <Badge variant={notified ? "default" : "secondary"}>
          {notified ? 'Sim' : 'Não'}
        </Badge>
      )
    },
    filterFn: (row, value, columnId) => {
        const rowValue = row.getValue(columnId)
        if (value === "sim") return rowValue === true;
        if (value === "nao") return rowValue === false;
        return true;
    }
  },
  {
    accessorKey: "observations",
    header: "Exame / Observações",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />,
  },
]
