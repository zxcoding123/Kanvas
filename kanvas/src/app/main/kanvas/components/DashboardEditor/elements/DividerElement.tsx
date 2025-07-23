'use client'

import { DashboardElement } from '../types'

export default function DividerElement({
  element,
  isPreviewMode
}: {
  element: DashboardElement
  isPreviewMode: boolean
}) {
  return (
    <div 
      className="w-full bg-gray-300"
      style={{ height: `${element.height}px` }}
    />
  )
}