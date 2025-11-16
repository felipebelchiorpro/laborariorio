
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
    header: "Observações",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />,
  },
]
