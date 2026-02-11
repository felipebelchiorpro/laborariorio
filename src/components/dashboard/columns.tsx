
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Files, FileText } from "lucide-react";
import type { Exam } from "@/lib/types"
import { DataTableRowActions } from "./data-table-row-actions";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { cn, normalizeText } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Função para gerar uma cor com base no hash do texto
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

// Função para determinar se a cor de fundo é clara ou escura
const isColorLight = (hexcolor: string) => {
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128;
}


export const getColumns = (
  onEdit: (exam: Exam) => void,
  onDelete: (exam: Exam) => void
): ColumnDef<Exam>[] => [
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
    cell: ({ row }) => {
      const withdrawnBy = row.original.withdrawnBy;
      if (!withdrawnBy) return null;

      const bgColor = stringToColor(withdrawnBy);
      const textColor = isColorLight(bgColor) ? 'black' : 'white';

      return (
        <Badge 
          className={cn("font-semibold text-white")}
          style={{ backgroundColor: bgColor, color: textColor }}
        >
          {withdrawnBy}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const normalizedRowValue = normalizeText(row.getValue(id));
      const normalizedFilterValue = normalizeText(value);
      return normalizedRowValue.includes(normalizedFilterValue);
    },
  },
  {
    accessorKey: "observations",
    header: "OBS",
  },
  {
    accessorKey: "pdfLinks",
    header: "PDFs",
    cell: ({ row }) => {
      const { pdfLinks } = row.original;
      if (!pdfLinks || pdfLinks.length === 0) return null;

      if (pdfLinks.length === 1) {
        return (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.open(pdfLinks[0].url, '_blank')}
            aria-label="Abrir PDF"
          >
              <FileText className="h-4 w-4 text-primary" />
          </Button>
        )
      }
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir PDFs">
               <Files className="h-4 w-4 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {pdfLinks.map((pdf, index) => (
              <DropdownMenuItem 
                key={index}
                onSelect={() => window.open(pdf.url, '_blank')}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{pdf.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />,
  },
]
