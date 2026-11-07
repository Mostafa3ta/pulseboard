'use client'

import { Table2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ChartTable {
  /** One sentence describing the rows. */
  caption: string
  columns: readonly string[]
  rows: readonly (readonly (string | number)[])[]
}

interface ChartCardProps {
  title: string
  subtitle?: string
  /** The same numbers as the chart, for anyone who prefers or needs a table. */
  table: ChartTable
  className?: string
  children: ReactNode
}

/** A titled card around a chart, with a "Data" button that shows the chart's numbers as a table. */
export function ChartCard({ title, subtitle, table, className, children }: ChartCardProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cn('min-w-0 rounded-xl border bg-card p-4 sm:p-5', className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Table2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Data</span>
              <span className="sr-only">table for {title}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{table.caption}</DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {table.columns.map((column, i) => (
                      <TableHead key={column} className={i > 0 ? 'text-right' : undefined}>
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.map((row, r) => (
                    <TableRow key={r}>
                      {row.map((cell, i) => (
                        <TableCell key={i} className={i > 0 ? 'text-right tabular-nums' : undefined}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </header>
      {children}
    </section>
  )
}
