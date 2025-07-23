'use client'

import { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { DashboardElement } from '../types'

export default function DraggableElement({
  element,
  children,
  isPreviewMode,
  isSelected,
  onClick
}: {
  element: DashboardElement
  children: React.ReactNode
  isPreviewMode: boolean
  isSelected: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)

  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { id: element.id, parentId: element.parentId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !isPreviewMode && !isResizing && element.positionType !== 'relative'
  })

  const [, drop] = useDrop({
    accept: 'element',
    hover: (item: { id: string }, monitor) => {
      if (!ref.current || isPreviewMode) return
      if (item.id === element.id) return

      // Handle drop logic here
    }
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      style={{
        position: element.positionType === 'absolute' ? 'absolute' : 'relative',
        left: element.positionType === 'absolute' ? `${element.x}px` : undefined,
        top: element.positionType === 'absolute' ? `${element.y}px` : undefined,
        width: typeof element.width === 'number' ? `${element.width}px` : element.width,
        height: typeof element.height === 'number' ? `${element.height}px` : element.height,
        opacity: isDragging ? 0.5 : 1,
        cursor: isPreviewMode || isResizing ? 'default' : 'move',
        margin: element.margin
      }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}