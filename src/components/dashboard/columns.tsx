"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TestTube } from "lucide-react";
import type { Exam, ExamStatus, ExamDestination } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const statusColorMap: Record<ExamStatus, string> = {
  "Pendente": "border-yellow-500 text-yellow-600",
  "Em Análise": "bg-blue-100 text-blue-800 border-blue-200",
  "Concluído": "bg-green-100 text-green-800 border-green-200",
  "Entregue": "bg-purple-100 text-purple-800 border-purple-200",
};

const examDestinations: ExamDestination[] = ['Laboratório Central', 'Clínica Parceira', 'Centro de Pesquisa'];


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
    accessorKey: "examType",
    header: "Tipo de Exame",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ExamStatus
      return <Badge className={statusColorMap[status]} variant="outline">{status}</Badge>
    },
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
