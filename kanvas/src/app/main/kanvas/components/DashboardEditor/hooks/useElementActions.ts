// src/app/main/kanvas/components/DashboardEditor/hooks/useElementActions.ts
import { Dispatch, SetStateAction } from 'react'
import { DashboardElement, TableInfo } from '../types'

interface UseElementActionsProps {
  elements: DashboardElement[]
  setElements: Dispatch<SetStateAction<DashboardElement[]>>
  tables: TableInfo[]
  fetchData: (query: string, elementId: string) => Promise<void>
  selectedElement: string | null
  setSelectedElement: Dispatch<SetStateAction<string | null>>
}

export function useElementActions({
  elements,
  setElements,
  tables,
  fetchData,
  selectedElement,
  setSelectedElement
}: UseElementActionsProps) {
  /**
   * Adds a new element to the dashboard
   */
  const addElement = (type: DashboardElement['type'], parentId?: string) => {
    const siblings = parentId
      ? elements.filter(el => el.parentId === parentId)
      : elements.filter(el => !el.parentId)

    // Calculate position based on last sibling
    const lastSibling = [...siblings].sort((a, b) => 
      (b.y + (typeof b.height === 'number' ? b.height : 150)) - 
      (a.y + (typeof a.height === 'number' ? a.height : 150))
    )[0]

    const baseX = parentId ? 10 : 100
    const baseY = parentId ? 10 : 100

    const newElement: DashboardElement = {
      id: `element-${Date.now()}`,
      type,
      x: lastSibling ? lastSibling.x : baseX,
      y: lastSibling 
        ? lastSibling.y + (typeof lastSibling.height === 'number' ? lastSibling.height : 150) + 10 
        : baseY,
      width: getDefaultWidth(type),
      height: getDefaultHeight(type),
      styles: getDefaultStyles(type),
      ...getTypeSpecificProps(type, tables),
      parentId,
      positionType: 'absolute',
      data: (type === 'table' || type === 'chart') ? [] : undefined
    }

    // Update parent's children if this is a nested element
    if (parentId) {
      setElements(prev => 
        prev.map(el => 
          el.id === parentId
            ? { ...el, children: [...(el.children || []), newElement.id] }
            : el
        )
      )
    }

    // Add the new element
    setElements(prev => [...prev, newElement])
    setSelectedElement(newElement.id)

    // Fetch initial data for data elements
    if ((type === 'table' || type === 'chart') && newElement.query) {
      fetchData(newElement.query, newElement.id)
    }
  }

  /**
   * Updates an existing element
   */
  const updateElement = (id: string, updates: Partial<DashboardElement>) => {
    setElements(prev => 
      prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    )

    // Refetch data if query or table name changed
    if ((updates.query || updates.tableName) && 
        (updates.type === 'table' || updates.type === 'chart')) {
      const query = updates.query || elements.find(el => el.id === id)?.query
      if (query) {
        fetchData(query, id)
      }
    }
  }

  /**
   * Deletes an element and its children recursively
   */
  const deleteElement = (id: string) => {
    // Remove from parent's children first
    setElements(prev => 
      prev.map(el => ({
        ...el,
        children: el.children?.filter(childId => childId !== id)
      }))
    )

    // Recursive deletion
    const deleteNested = (elementId: string) => {
      const element = elements.find(el => el.id === elementId)
      if (element?.children) {
        element.children.forEach(childId => deleteNested(childId))
      }
      setElements(prev => prev.filter(el => el.id !== elementId))
    }

    deleteNested(id)

    // Clear selection if deleted element was selected
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  return { 
    addElement, 
    updateElement, 
    deleteElement 
  }
}

// Helper functions for default values
function getDefaultWidth(type: DashboardElement['type']): number | 'auto' | '100%' {
  switch (type) {
    case 'divider': return 300
    case 'container': return 400
    default: return 200
  }
}

function getDefaultHeight(type: DashboardElement['type']): number | 'auto' | '100%' {
  switch (type) {
    case 'divider': return 2
    case 'container': return 300
    default: return 150
  }
}

function getDefaultStyles(type: DashboardElement['type']): React.CSSProperties {
  const baseStyles = {
    borderRadius: '4px',
    padding: '0px'
  }

  switch (type) {
    case 'text':
      return { 
        ...baseStyles,
        backgroundColor: 'var(--slight-white-color)',
        border: '1px dashed var(--green-color)'
      }
    case 'container':
      return {
        ...baseStyles,
        backgroundColor: 'rgba(210, 210, 210, 0.2)',
        border: '1px dashed var(--green-color)',
        padding: '10px'
      }
    case 'divider':
      return {
        ...baseStyles,
        backgroundColor: 'var(--green-color)',
        border: 'none'
      }
    default:
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        border: '1px dashed var(--green-color)'
      }
  }
}

function getTypeSpecificProps(
  type: DashboardElement['type'], 
  tables: TableInfo[]
): Partial<DashboardElement> {
  switch (type) {
    case 'text':
      return {
        content: 'New Text',
        textType: 'paragraph',
        textFormat: []
      }
    case 'table':
    case 'chart':
      const tableName = tables[0]?.name || ''
      return {
        tableName,
        query: `SELECT * FROM ${tableName} LIMIT 10`,
        data: []
      }
    case 'chart':
      return {
        chartType: 'bar'
      }
    case 'image':
      return {
        content: ''
      }
    default:
      return {}
  }
}