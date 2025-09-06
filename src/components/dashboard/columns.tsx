"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Exam, ExamDestination } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";


const examDestinations: ExamDestination[] = ['Laboratório Central', 'Clínica Parceira', 'Centro de Pesquisa', 'São João'];


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
    accessorKey: "destination",
    header: "Destino do Exame",
    cell: ({ row }) => {
      // For now, we'll just display it. A real implementation would
      // likely involve a state management solution to update the destination.
      return (
        <Select defaultValue={row.original.destination}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o destino" />
            </SelectTrigger>
            <SelectContent>
                {examDestinations.map(dest => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      )
    },
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
