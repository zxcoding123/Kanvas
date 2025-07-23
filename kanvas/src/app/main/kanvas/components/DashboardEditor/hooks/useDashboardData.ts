// src/app/main/kanvas/components/DashboardEditor/hooks/useDashboardData.ts
import { Dispatch, SetStateAction } from 'react'
import { DashboardElement, TableInfo } from '../types'

export function useDashboardData() {
  const fetchTables = async () => {
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/list-tables.php')
      const data = await res.json()
      return data.tables as TableInfo[]
    } catch (error) {
      console.error('Error fetching tables:', error)
      return []
    }
  }

  const fetchData = async (query: string, elementId: string, setElements: Dispatch<SetStateAction<DashboardElement[]>>) => {
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/execute-query.php', {
        method: 'POST',
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      if (data.success) {
        setElements(prev => prev.map(el =>
          el.id === elementId ? { ...el, data: data.results } : el
        ))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  return { fetchTables, fetchData }
}