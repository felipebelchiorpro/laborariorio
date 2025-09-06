"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Exam } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";


export const columns: ColumnDef<Exam>[] = [
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
    }
  },
  {
    accessorKey: "receivedDate",
    header: "Data Recebida",
    cell: ({ row }) => {
        const { receivedDate } = row.original;
        return receivedDate ? format(new Date(receivedDate), "dd/MM/yyyy") : 'N/A';
    }
  },
   {
    accessorKey: "withdrawnBy",
    header: "Retirado Por",
  },
  {
    accessorKey: "observations",
    header: "OBS",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
