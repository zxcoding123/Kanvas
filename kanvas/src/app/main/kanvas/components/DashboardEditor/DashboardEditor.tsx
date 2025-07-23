// src/app/main/kanvas/components/DashboardEditor/DashboardEditor.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Sidebar from './Sidebar'
import DashboardArea from './DashboardArea'
import PropertiesPanel from './PropertiesPanel'
import Notification from './Notification'
import { DashboardElement, Page, TableInfo } from './types'
import { useDashboardData } from './hooks/useDashboardData'
import { useElementActions } from './hooks/useElementActions'

export default function DashboardEditor() {
  const [pages, setPages] = useState<Page[]>([{ id: 'page-1', name: 'Page 1', elements: [] }])
  const [currentPageId, setCurrentPageId] = useState<string>('page-1')
  const [elements, setElements] = useState<DashboardElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [dashboardName, setDashboardName] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [message, setMessage] = useState('')
  const dashboardRef = useRef<HTMLDivElement>(null)

  // Create a wrapped fetchData function that includes setElements
  const { fetchTables } = useDashboardData()
  const wrappedFetchData = async (query: string, elementId: string) => {
    const { fetchData } = useDashboardData()
    return fetchData(query, elementId, setElements)
  }

  const { addElement, updateElement, deleteElement } = useElementActions({
    elements,
    setElements,
    tables,
    fetchData: wrappedFetchData,
    selectedElement,
    setSelectedElement
  })

  // Create a type-safe addElement wrapper for Sidebar
  const addElementWrapper = (type: string, parentId?: string) => {
    const validTypes: DashboardElement['type'][] = ['text', 'image', 'chart', 'table', 'divider', 'container']
    if (validTypes.includes(type as DashboardElement['type'])) {
      addElement(type as DashboardElement['type'], parentId)
    }
  }

  useEffect(() => {
    const loadTables = async () => {
      const loadedTables = await fetchTables()
      setTables(loadedTables)
    }
    loadTables()
  }, [fetchTables])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full">
        <Sidebar
          dashboardName={dashboardName}
          setDashboardName={setDashboardName}
          isPreviewMode={isPreviewMode}
          setIsPreviewMode={setIsPreviewMode}
          addElement={addElementWrapper}  // Use the type-safe wrapper
          tables={tables}
          setMessage={setMessage}
          selectedElement={selectedElement}
        />

        <DashboardArea
          ref={dashboardRef}
          elements={elements}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          isPreviewMode={isPreviewMode}
          updateElement={updateElement}
          deleteElement={deleteElement}
        />


        {selectedElement && !isPreviewMode && (
          <PropertiesPanel
            element={elements.find(el => el.id === selectedElement)!}
            updateElement={updateElement}
            tables={tables}
            deleteElement={deleteElement}
          />
        )}
      </div>

      {message && (
        <Notification message={message} clearMessage={() => setMessage('')} />
      )}
    </DndProvider>
  )
}