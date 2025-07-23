'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline } from 'lucide-react'
import { DashboardElement } from '../types'
export default function TextElement({
  element,
  updateElement,
  isPreviewMode
}: {
  element: DashboardElement
  updateElement: (updates: Partial<DashboardElement>) => void
  isPreviewMode: boolean
}) {
  const Tag = element.textType === 'h1' ? 'h1' :
    element.textType === 'h2' ? 'h2' :
      element.textType === 'h3' ? 'h3' : 'p'

  const textStyles = {
    fontFamily: 'var(--font-poppins)',
    color: '#333',
    margin: 0,
    fontWeight: element.textFormat?.includes('bold') ? 'bold' : 'normal',
    fontStyle: element.textFormat?.includes('italic') ? 'italic' : 'normal',
    textDecoration: element.textFormat?.includes('underline') ? 'underline' : 'none',
    fontSize: element.textType === 'h1' ? '2em' :
      element.textType === 'h2' ? '1.5em' :
        element.textType === 'h3' ? '1.17em' : '1em',
    lineHeight: '1.5'
  }

  return (
    <div className="w-full h-full p-2 flex flex-col">
      {!isPreviewMode && (
        <div className="mb-2">
          <ToggleGroup
            type="multiple"
            value={element.textFormat || []}
            onValueChange={(value) => updateElement({
              textFormat: value as ('bold' | 'italic' | 'underline')[]
            })}
          >
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <Tag
        contentEditable={!isPreviewMode}
        style={textStyles}
        onBlur={(e) => updateElement({ content: e.currentTarget.textContent || '' })}
        suppressContentEditableWarning
        className="outline-none"
      >
        {element.content}
      </Tag>
    </div>
  )
}