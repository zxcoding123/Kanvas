'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardElement } from '../types'

export default function TableElement({
  element,
  updateElement,
  isPreviewMode
}: {
  element: DashboardElement
  updateElement: (updates: Partial<DashboardElement>) => void
  isPreviewMode: boolean
}) {
  const columns = element.data?.length ? Object.keys(element.data[0]) : []

  return (
    <div className="w-full h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {element.data?.length ? (
            element.data.map((row: any, i: number) => (
              <TableRow key={i}>
                {columns.map(col => (
                  <TableCell key={`${i}-${col}`}>
                    {row[col]?.toString() || ''}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No table data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}