// src/app/main/kanvas/components/DashboardEditor/DashboardArea.tsx
'use client'

import { forwardRef } from 'react'
import DraggableElement from './elements/DraggableElement'
import TextElement from './elements/TextElement'
import ImageElement from './elements/ImageElement'
import ChartElement from './elements/ChartElement'
import TableElement from './elements/TableElement'
import DividerElement from './elements/DividerElement'
import ContainerElement from './elements/ContainerElement'
import { DashboardElement } from './types'

const DashboardArea = forwardRef<HTMLDivElement, {
  elements: DashboardElement[]
  selectedElement: string | null
  setSelectedElement: (id: string | null) => void
  isPreviewMode: boolean
  updateElement: (id: string, updates: Partial<DashboardElement>) => void
  deleteElement: (id: string) => void
}>(({ elements, selectedElement, setSelectedElement, isPreviewMode, updateElement, deleteElement }, ref) => {
  // Create a curried update function that knows the element ID
  const handleUpdateElement = (elementId: string) => (updates: Partial<DashboardElement>) => {
    updateElement(elementId, updates)
  }

  const renderElement = (element: DashboardElement) => {
    const elementUpdate = handleUpdateElement(element.id)
    
    switch (element.type) {
      case 'text':
        return (
          <TextElement 
            element={element} 
            updateElement={elementUpdate} 
            isPreviewMode={isPreviewMode} 
          />
        )
      case 'image':
        return (
          <ImageElement 
            element={element} 
            updateElement={elementUpdate} 
            isPreviewMode={isPreviewMode} 
          />
        )
      case 'chart':
        return (
          <ChartElement 
            element={element} 
            updateElement={elementUpdate} 
            isPreviewMode={isPreviewMode} 
          />
        )
      case 'table':
        return (
          <TableElement 
            element={element} 
            updateElement={elementUpdate} 
            isPreviewMode={isPreviewMode} 
          />
        )
      case 'divider':
        return <DividerElement element={element} isPreviewMode={isPreviewMode} />
      case 'container':
        return (
          <ContainerElement 
            element={element} 
            updateElement={elementUpdate}
            isPreviewMode={isPreviewMode} 
            elements={elements}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
          />
        )
      default:
        return null
    }
  }

  return (
    <div 
      ref={ref}
      className="flex-1 relative bg-gray-50 overflow-auto p-5"
    >
      <div className="relative bg-white shadow-md p-5 min-h-full">
        {elements
          .filter(el => !el.parentId)
          .map((element) => (
            <DraggableElement
              key={element.id}
              element={element}
              isPreviewMode={isPreviewMode}
              isSelected={selectedElement === element.id}
              onClick={() => setSelectedElement(element.id)}
            >
              {renderElement(element)}
            </DraggableElement>
          ))}
      </div>
    </div>
  )
})

DashboardArea.displayName = 'DashboardArea'

export default DashboardArea