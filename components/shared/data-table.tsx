"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  toolbar?: React.ReactNode
  onRowClick?: (row: TData) => void
  enableRowSelection?: boolean
  enablePagination?: boolean
  pageSize?: number
  // Server-side pagination
  serverPagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    onPageChange: (page: number) => void
  }
  onSearchChange?: (search: string) => void
  onSelectionChange?: (selectedRows: TData[]) => void
  getRowId?: (row: TData) => string | number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  toolbar,
  onRowClick,
  enableRowSelection = false,
  enablePagination = true,
  pageSize = 10,
  serverPagination,
  onSearchChange,
  onSelectionChange,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  // Handle search change for server-side
  const handleSearchChange = (value: string) => {
    setGlobalFilter(value)
    onSearchChange?.(value)
  }

  // Ensure we have a valid getRowId function that never returns empty string
  // Create a map to track row indices for fallback IDs
  const rowIndexMap = React.useMemo(() => {
    const map = new Map()
    data.forEach((row, index) => {
      const id = getRowId ? getRowId(row) : (row as any).id
      const key = id?.toString() || `row-${index}`
      map.set(row, key)
    })
    return map
  }, [data, getRowId])

  const getRowIdFn = React.useCallback((row: any) => {
    if (getRowId) {
      const id = getRowId(row)
      if (id !== undefined && id !== null && id !== "") {
        return id.toString()
      }
    }
    if (row.id !== undefined && row.id !== null) {
      return row.id.toString()
    }
    // Fallback to mapped ID
    return rowIndexMap.get(row) || `row-${data.indexOf(row)}`
  }, [getRowId, rowIndexMap, data])

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowIdFn,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      try {
        const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
        setRowSelection(newSelection)
      } catch (error) {
        console.error("Error updating row selection:", error)
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    enableRowSelection: enableRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Update parent when selection changes
  React.useEffect(() => {
    if (onSelectionChange && enableRowSelection) {
      try {
        const selectedRows = Object.keys(rowSelection)
          .filter(key => rowSelection[key])
          .map(key => {
            const row = data.find((row: any) => {
              try {
                const rowId = getRowIdFn(row)
                return rowId === key
              } catch (error) {
                console.error("Error getting row ID:", error)
                return false
              }
            })
            return row
          })
          .filter(Boolean) as TData[]
        onSelectionChange(selectedRows)
      } catch (error) {
        console.error("Error updating selection:", error)
      }
    }
  }, [rowSelection, data, onSelectionChange, enableRowSelection, getRowIdFn])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {searchKey && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {toolbar}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowId = getRowIdFn(row.original)
                return (
                  <TableRow
                    key={rowId || row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50",
                      row.getIsSelected() && "bg-muted/50"
                    )}
                    onClick={(e) => {
                      if (enableRowSelection && (e.target as HTMLElement).closest('input[type="checkbox"]')) {
                        return // Don't trigger row click when clicking checkbox
                      }
                      onRowClick?.(row.original)
                    }}
                  >
                    {enableRowSelection && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(value) => {
                            try {
                              row.toggleSelected(!!value)
                            } catch (error) {
                              console.error("Error toggling row selection:", error)
                              // Fallback: manually update selection
                              const currentId = row.id
                              setRowSelection((prev) => ({
                                ...prev,
                                [currentId]: !!value
                              }))
                            }
                          }}
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {enableRowSelection && (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
              </span>
            )}
            {serverPagination 
              ? `${serverPagination.totalCount} row(s)`
              : `${table.getFilteredRowModel().rows.length} row(s)`
            }
          </div>
          <div className="flex items-center gap-2">
            {serverPagination ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => serverPagination.onPageChange(serverPagination.currentPage - 1)}
                  disabled={serverPagination.currentPage <= 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span>Page</span>
                  <strong>
                    {serverPagination.currentPage} of {serverPagination.totalPages}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => serverPagination.onPageChange(serverPagination.currentPage + 1)}
                  disabled={serverPagination.currentPage >= serverPagination.totalPages}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span>Page</span>
                  <strong>
                    {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Column helper for sortable headers
interface SortableHeaderProps {
  column: any
  children: React.ReactNode
}

export function SortableHeader({ column, children }: SortableHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ChevronUp className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDown className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

// Actions dropdown for table rows
interface RowActionsProps {
  actions: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: "default" | "destructive"
  }[]
}

export function RowActions({ actions }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
            }}
            className={cn(
              action.variant === "destructive" &&
                "text-destructive focus:text-destructive"
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

