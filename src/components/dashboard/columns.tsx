"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Exam, ExamStatus } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";


const statusVariantMap: Record<ExamStatus, "default" | "secondary" | "destructive" | "outline"> = {
  "Pending": "outline",
  "In Analysis": "default",
  "Completed": "secondary",
  "Delivered": "destructive", // No green variant, using destructive as a placeholder
};

const statusColorMap: Record<ExamStatus, string> = {
  "Pending": "border-yellow-500 text-yellow-600",
  "In Analysis": "bg-blue-100 text-blue-800 border-blue-200",
  "Completed": "bg-green-100 text-green-800 border-green-200",
  "Delivered": "bg-purple-100 text-purple-800 border-purple-200",
};


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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
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
          Patient
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
    header: "Exam Type",
  },
  {
    accessorKey: "collectionDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Collection Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div>{format(new Date(row.getValue("collectionDate")), 'PP')}</div>
    }
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
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
