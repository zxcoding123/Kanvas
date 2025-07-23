// src/app/main/kanvas/components/DashboardEditor/PropertiesPanel.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, Pilcrow } from 'lucide-react'
import { DashboardElement, TableInfo } from './types'

const textTypes = [
  { value: 'paragraph', label: 'Paragraph', icon: <Pilcrow size={16} /> },
  { value: 'h1', label: 'Heading 1', icon: <Heading1 size={16} /> },
  { value: 'h2', label: 'Heading 2', icon: <Heading2 size={16} /> },
  { value: 'h3', label: 'Heading 3', icon: <Heading3 size={16} /> }
]

const chartTypes = ['bar', 'line', 'pie']

interface PropertiesPanelProps {
  element: DashboardElement
  updateElement: (id: string, updates: Partial<DashboardElement>) => void
  tables: TableInfo[]
  deleteElement: (id: string) => void
}

export default function PropertiesPanel({
  element,
  updateElement,
  tables,
  deleteElement
}: PropertiesPanelProps) {
  const handleUpdate = (updates: Partial<DashboardElement>) => {
    updateElement(element.id, updates)
  }

  return (
    <div className="w-[300px] bg-white border-l border-gray-200 p-5 overflow-y-auto">
      <h3 className="text-lg font-bold mb-5">Element Properties</h3>
      
      <div className="space-y-4">
        <div>
          <Label>ID</Label>
          <Input value={element.id} disabled className="mt-1" />
        </div>
        
        <div>
          <Label>Type</Label>
          <Input value={element.type} disabled className="mt-1" />
        </div>

        {element.positionType !== 'relative' && (
          <div>
            <Label>Position</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                value={element.x}
                onChange={(e) => handleUpdate({ x: Number(e.target.value) })}
                placeholder="X"
                className="w-16"
              />
              <Input
                type="number"
                value={element.y}
                onChange={(e) => handleUpdate({ y: Number(e.target.value) })}
                placeholder="Y"
                className="w-16"
              />
            </div>
          </div>
        )}

        <div>
          <Label>Size</Label>
          <div className="flex gap-2 mt-1">
            <Select
              value={typeof element.width === 'number' ? element.width.toString() : element.width}
              onValueChange={(value) => handleUpdate({
                width: value === 'auto' || value === '100%' ? value : Number(value),
                isFullWidth: value === '100%'
              })}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
                <SelectItem value="200">200px</SelectItem>
                <SelectItem value="300">300px</SelectItem>
                <SelectItem value="400">400px</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeof element.height === 'number' ? element.height.toString() : element.height}
              onValueChange={(value) => handleUpdate({
                height: value === 'auto' || value === '100%' ? value : Number(value),
                isFullHeight: value === '100%'
              })}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Height" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
                <SelectItem value="150">150px</SelectItem>
                <SelectItem value="200">200px</SelectItem>
                <SelectItem value="300">300px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Position Type</Label>
          <Select
            value={element.positionType || 'absolute'}
            onValueChange={(value) => handleUpdate({ positionType: value as 'absolute' | 'relative' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absolute">Absolute</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Margin</Label>
          <Input
            value={element.margin || '0px'}
            onChange={(e) => handleUpdate({ margin: e.target.value })}
            placeholder="e.g., 10px or 10px 20px"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Padding</Label>
          <Input
            value={element.padding || '0px'}
            onChange={(e) => handleUpdate({ padding: e.target.value })}
            placeholder="e.g., 10px or 10px 20px"
            className="mt-1"
          />
        </div>

        {(element.type === 'table' || element.type === 'chart') && (
          <>
            <div>
              <Label>Table</Label>
              <Select
                value={element.tableName || ''}
                onValueChange={(value) => handleUpdate({
                  tableName: value,
                  query: `SELECT * FROM ${value} LIMIT 10`
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Query</Label>
              <Input
                value={element.query || ''}
                onChange={(e) => handleUpdate({ query: e.target.value })}
                placeholder="SELECT * FROM table LIMIT 10"
                className="mt-1"
              />
            </div>
          </>
        )}

        {element.type === 'chart' && (
          <div>
            <Label>Chart Type</Label>
            <Select
              value={element.chartType || 'bar'}
              onValueChange={(value) => handleUpdate({ chartType: value as 'bar' | 'line' | 'pie' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {element.type === 'image' && (
          <div>
            <Label>Image URL</Label>
            <Input
              value={element.content || ''}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              placeholder="Enter image URL"
              className="mt-1"
            />
          </div>
        )}

        {element.type === 'text' && (
          <>
            <div>
              <Label>Text Type</Label>
              <Select
                value={element.textType || 'paragraph'}
                onValueChange={(value) => handleUpdate({ textType: value as 'paragraph' | 'h1' | 'h2' | 'h3' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text type" />
                </SelectTrigger>
                <SelectContent>
                  {textTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text Format</Label>
              <ToggleGroup
                type="multiple"
                value={element.textFormat || []}
                onValueChange={(value) => handleUpdate({ textFormat: value as ('bold' | 'italic' | 'underline')[] })}
                className="mt-1"
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
          </>
        )}

        {element.type === 'container' && (
          <>
            <div>
              <Label>Layout</Label>
              <div className="flex items-center gap-2 mt-1">
                <Switch
                  checked={element.isFullWidth || false}
                  onCheckedChange={(checked) => handleUpdate({ 
                    isFullWidth: checked, 
                    width: checked ? '100%' : 400 
                  })}
                />
                <span>Full Width</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Switch
                  checked={element.isFullHeight || false}
                  onCheckedChange={(checked) => handleUpdate({ 
                    isFullHeight: checked, 
                    height: checked ? '100%' : 300 
                  })}
                />
                <span>Full Height</span>
              </div>
            </div>
            <div>
              <Label>Children: {element.children?.length || 0}</Label>
            </div>
          </>
        )}

        <div>
          <Label>Background Color</Label>
          <Input
            type="color"
            value={element.styles?.backgroundColor || '#ffffff'}
            onChange={(e) => handleUpdate({
              styles: { ...element.styles, backgroundColor: e.target.value }
            })}
            className="mt-1 w-full p-0 border-none"
          />
        </div>

        <Button
          variant="destructive"
          onClick={() => deleteElement(element.id)}
          className="w-full mt-4"
        >
          Delete Element
        </Button>
      </div>
    </div>
  )
}