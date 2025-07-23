'use client'

import { useState } from 'react'
import DraggableElement from './DraggableElement'
import TextElement from './TextElement'
import ImageElement from './ImageElement'
import ChartElement from './ChartElement'
import TableElement from './TableElement'
import DividerElement from './DividerElement'
import { DashboardElement } from '../types'

export default function ContainerElement({
  element,
  updateElement,
  isPreviewMode,
  elements,
  selectedElement,
  setSelectedElement
}: {
  element: DashboardElement
  updateElement: (updates: Partial<DashboardElement>) => void
  isPreviewMode: boolean
  elements: DashboardElement[]
  selectedElement: string | null
  setSelectedElement: (id: string | null) => void
}) {
  const [isResizing, setIsResizing] = useState(false)
  const childElements = elements.filter(el => element.children?.includes(el.id))

  return (
    <div
      className={`relative rounded border-2 ${element.id === selectedElement ? 'border-green-500' : 'border-dashed border-gray-400'}`}
      style={{
        backgroundColor: element.styles?.backgroundColor,
        padding: element.padding,
        minHeight: '100px'
      }}
      onClick={(e) => {
        if (!isPreviewMode && !isResizing) {
          e.stopPropagation()
          setSelectedElement(element.id)
        }
      }}
    >
      {childElements.map(child => (
        <DraggableElement
          key={child.id}
          element={child}
          isPreviewMode={isPreviewMode}
          isSelected={selectedElement === child.id}
          onClick={() => setSelectedElement(child.id)}
        >
          {child.type === 'text' && <TextElement element={child} updateElement={updateElement} isPreviewMode={isPreviewMode} />}
          {child.type === 'image' && <ImageElement element={child} updateElement={updateElement} isPreviewMode={isPreviewMode} />}
          {child.type === 'chart' && <ChartElement element={child} updateElement={updateElement} isPreviewMode={isPreviewMode} />}
          {child.type === 'table' && <TableElement element={child} updateElement={updateElement} isPreviewMode={isPreviewMode} />}
          {child.type === 'divider' && <DividerElement element={child} isPreviewMode={isPreviewMode} />}
        </DraggableElement>
      ))}
    </div>
  )
}