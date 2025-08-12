"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { Table } from "@tanstack/react-table"

interface DataTableToolbarProps<TData> {
  table?: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({ 
  table, 
  searchKey, 
  searchPlaceholder = "Search...",
  children 
}: DataTableToolbarProps<TData>) {
  const isFiltered = table ? table.getState().columnFilters.length > 0 : false

  const onReset = () => {
    if (table) {
      table.resetColumnFilters()
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && table && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
      {table && <DataTableViewOptions table={table} />}
    </div>
  )
} 