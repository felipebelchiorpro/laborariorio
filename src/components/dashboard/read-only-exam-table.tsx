"use client";

import * as React from "react";
import type { Exam } from "@/lib/types";
import { getExams } from "@/lib/google-api";
import { toast } from "@/hooks/use-toast";
import { readOnlyColumns } from "./read-only-columns";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface ReadOnlyExamTableProps {
    sheetId: string;
}

export default function ReadOnlyExamTable({ sheetId }: ReadOnlyExamTableProps) {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data: exams,
    columns: readOnlyColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    filterFns: {
        // override the default `contains` filter to be case-insensitive and accent-insensitive
        contains: (row, id, value) => {
            const rowValue = row.getValue(id) as string;
            const filterValue = value as string;

            const normalize = (str: string) => 
                str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            
            return normalize(rowValue).includes(normalize(filterValue));
        }
    },
    globalFilterFn: 'contains',
  });

  const fetchExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExams(sheetId);
      setExams(data);
    } catch (error) {
      console.error("Failed to fetch exams for public view:", error);
      toast({
        title: "Erro ao buscar exames",
        description: "Não foi possível carregar os dados da planilha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  React.useEffect(() => {
    if (sheetId) {
      fetchExams();
    }
  }, [fetchExams, sheetId]);

  return (
    <div className="space-y-4">
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
                 <Input
                placeholder="Filtrar por destino..."
                value={(table.getColumn("withdrawnBy")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                    table.getColumn("withdrawnBy")?.setFilterValue(event.target.value)
                }
                className="h-9 w-[150px] lg:w-[250px]"
                />
            </div>
             <DataTableViewOptions table={table} />
        </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={readOnlyColumns.length} className="h-24 text-center">
                    Carregando...
                    </TableCell>
                </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={readOnlyColumns.length} className="h-24 text-center">
                  Sem resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} exame(s) encontrado(s).
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
