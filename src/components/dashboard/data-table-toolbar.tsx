"use client"

import { Table } from "@tanstack/react-table"
import { PlusCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { withdrawnByOptions } from "@/lib/data"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAddPatient: () => void;
}

export function DataTableToolbar<TData>({
  table,
  onAddPatient,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filtrar por nome do paciente..."
          value={(table.getColumn("patientName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("patientName")?.setFilterValue(event.target.value)
          }
          className="h-9 w-[150px] lg:w-[250px]"
        />
        <DataTableFacetedFilter
            column={table.getColumn("withdrawnBy")}
            title="Retirado Por"
            options={withdrawnByOptions}
        />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Resetar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        <Button size="sm" onClick={onAddPatient}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Paciente
        </Button>
      </div>
    </div>
  )
}
