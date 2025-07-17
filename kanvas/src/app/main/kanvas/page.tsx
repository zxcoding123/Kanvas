'use client'

import { useState, useRef, useEffect } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Define types for dashboard elements
type DashboardElement = {
  id: string
  type: 'text' | 'image' | 'chart' | 'table' | 'divider'
  content?: string
  x: number
  y: number
  width: number
  height: number
  styles?: React.CSSProperties
  tableName?: string // For table/chart elements
  chartType?: 'bar' | 'line' | 'pie' // For chart elements
  query?: string // Custom SQL query
}

type TableInfo = {
  name: string
  structure: { Field: string; Type: string; Null: string; Key: string; Default: string | null; Extra: string }[]
}

// Element types available in the sidebar
const elementTypes = [
  { type: 'text', label: 'Text Box', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'chart', label: 'Chart', icon: '📊' },
  { type: 'table', label: 'Table', icon: '📋' },
  { type: 'divider', label: 'Divider', icon: '―' }
]

const chartTypes = ['bar', 'line', 'pie']

export default function DashboardEditor() {
  const [elements, setElements] = useState<DashboardElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [dashboardName, setDashboardName] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [message, setMessage] = useState('')
  const dashboardRef = useRef<HTMLDivElement>(null)

  // Fetch existing tables
  const fetchTables = async () => {
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/list-tables.php', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const data = await res.json()
      if (data.success) {
        setTables(data.tables)
      } else {
        throw new Error(data.error || 'Failed to fetch tables')
      }
    } catch (error) {
      setMessage(`❌ Error fetching tables: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Load saved dashboard
  const loadDashboard = async () => {
    if (!dashboardName.trim()) return
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/dashboard.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load', dashboardName })
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const data = await res.json()
      if (data.success) {
        setElements(data.dashboard.elements || [])
        setMessage(`✅ Dashboard "${dashboardName}" loaded successfully`)
      } else {
        throw new Error(data.error || 'Failed to load dashboard')
      }
    } catch (error) {
      setMessage(`❌ Error loading dashboard: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Save dashboard
  const saveDashboard = async () => {
    if (!dashboardName.trim()) {
      setMessage('❌ Dashboard name is required')
      return
    }
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/dashboard.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', dashboardName, elements })
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ Dashboard "${dashboardName}" saved successfully`)
      } else {
        throw new Error(data.error || 'Failed to save dashboard')
      }
    } catch (error) {
      setMessage(`❌ Error saving dashboard: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Fetch tables on mount
  useEffect(() => {
    fetchTables()
  }, [])

  // Add new element to dashboard
  const addElement = (type: DashboardElement['type']) => {
    const newElement: DashboardElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text' : undefined,
      x: 100,
      y: 100,
      width: type === 'divider' ? 300 : 200,
      height: type === 'divider' ? 2 : 150,
      styles: {
        backgroundColor: type === 'text' ? 'var(--slight-white-color)' : 'transparent',
        border: type !== 'divider' ? '1px dashed var(--green-color)' : 'none',
        borderRadius: '4px'
      },
      tableName: type === 'table' || type === 'chart' ? (tables[0]?.name || '') : undefined,
      chartType: type === 'chart' ? 'bar' : undefined,
      query: type === 'table' || type === 'chart' ? `SELECT * FROM ${tables[0]?.name || ''} LIMIT 10` : undefined
    }
    setElements([...elements, newElement])
  }

  // Update element properties
  const updateElement = (id: string, updates: Partial<DashboardElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }

  // Move element
  const moveElement = (id: string, x: number, y: number) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, x, y } : el
    ))
  }

  // Delete element
  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  // Handle element selection
  const selectElement = (id: string) => {
    setSelectedElement(id === selectedElement ? null : id)
  }

  // Render element based on type
  const renderElement = (element: DashboardElement) => {
    const isSelected = element.id === selectedElement
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: isPreviewMode ? 'default' : 'move',
      ...element.styles,
      border: isSelected && !isPreviewMode 
        ? '2px solid var(--green-color)'
        : element.styles?.border
    }

    switch (element.type) {
      case 'text':
        return (
          <div 
            style={baseStyles}
            onClick={() => !isPreviewMode && selectElement(element.id)}
          >
            <div 
              contentEditable={!isPreviewMode}
              style={{ 
                padding: '8px',
                fontFamily: 'var(--font-poppins)',
                color: '#333'
              }}
              onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
            >
              {element.content}
            </div>
          </div>
        )
      case 'image':
        return (
          <div 
            style={{
              ...baseStyles,
              backgroundImage: element.content ? `url(${element.content})` : 'url(https://via.placeholder.com/200x150)',
              backgroundSize: 'cover'
            }}
            onClick={() => !isPreviewMode && selectElement(element.id)}
          />
        )
      case 'chart':
        return (
          <div 
            style={{
              ...baseStyles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--slight-white-color)'
            }}
            onClick={() => !isPreviewMode && selectElement(element.id)}
          >
            <span style={{ fontFamily: 'var(--font-poppins)' }}>
              [{element.chartType} Chart: {element.tableName || 'No Table Selected'}]
            </span>
          </div>
        )
      case 'table':
        return (
          <div 
            style={{
              ...baseStyles,
              backgroundColor: 'var(--slight-white-color)',
              padding: '8px',
              overflow: 'auto'
            }}
            onClick={() => !isPreviewMode && selectElement(element.id)}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {tables.find(t => t.name === element.tableName)?.structure.map(col => (
                    <TableHead key={col.Field}>{col.Field}</TableHead>
                  )) || <TableHead>No Columns</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={tables.find(t => t.name === element.tableName)?.structure.length || 1}>
                    [Table Data: {element.tableName || 'No Table Selected'}]
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )
      case 'divider':
        return (
          <div 
            style={{
              ...baseStyles,
              backgroundColor: 'var(--green-color)',
              height: '2px'
            }}
            onClick={() => !isPreviewMode && selectElement(element.id)}
          />
        )
      default:
        return null
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'var(--font-poppins)',
        backgroundColor: 'var(--slight-beige-color)'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          backgroundColor: 'var(--green-color)',
          color: 'white',
          padding: '20px'
        }}>
          <h2 style={{ marginBottom: '20px' }}>Dashboard Builder</h2>
          <div style={{ marginBottom: '20px' }}>
            <Label>Dashboard Name</Label>
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="Enter dashboard name"
              style={{ marginTop: '5px' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Button onClick={saveDashboard}>Save</Button>
              <Button onClick={loadDashboard} variant="outline">Load</Button>
            </div>
          </div>
          <h3 style={{ marginBottom: '10px' }}>Elements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {elementTypes.map((item) => (
              <div
                key={item.type}
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--beige-color)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onClick={() => addElement(item.type as DashboardElement['type'])}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}>
            <Label>Mode</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
              <Switch
                checked={isPreviewMode}
                onCheckedChange={setIsPreviewMode}
              />
              <span>{isPreviewMode ? 'Preview' : 'Edit'}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div 
          ref={dashboardRef}
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: 'var(--slight-white-color)',
            overflow: 'auto',
            padding: '20px'
          }}
        >
          <div style={{
            minHeight: '100%',
            minWidth: '100%',
            position: 'relative',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}>
            {elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                moveElement={moveElement}
                isPreviewMode={isPreviewMode}
              >
                {renderElement(element)}
              </DraggableElement>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && !isPreviewMode && (
          <div style={{
            width: '300px',
            backgroundColor: 'white',
            borderLeft: '1px solid #ddd',
            padding: '20px',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Element Properties</h3>
            {(() => {
              const element = elements.find(el => el.id === selectedElement)
              if (!element) return null
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <Label>ID</Label>
                    <Input value={element.id} disabled />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input value={element.type} disabled />
                  </div>
                  <div>
                    <Label>Position</Label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Input
                        type="number"
                        value={element.x}
                        onChange={(e) => updateElement(element.id, { x: Number(e.target.value) })}
                        placeholder="X"
                        style={{ width: '50px' }}
                      />
                      <Input
                        type="number"
                        value={element.y}
                        onChange={(e) => updateElement(element.id, { y: Number(e.target.value) })}
                        placeholder="Y"
                        style={{ width: '50px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Size</Label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Input
                        type="number"
                        value={element.width}
                        onChange={(e) => updateElement(element.id, { width: Number(e.target.value) })}
                        placeholder="Width"
                        style={{ width: '50px' }}
                      />
                      <Input
                        type="number"
                        value={element.height}
                        onChange={(e) => updateElement(element.id, { height: Number(e.target.value) })}
                        placeholder="Height"
                        style={{ width: '50px' }}
                      />
                    </div>
                  </div>
                  {(element.type === 'table' || element.type === 'chart') && (
                    <>
                      <div>
                        <Label>Table</Label>
                        <Select
                          value={element.tableName || ''}
                          onValueChange={(value) => updateElement(element.id, { 
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
                          onChange={(e) => updateElement(element.id, { query: e.target.value })}
                          placeholder="SELECT * FROM table LIMIT 10"
                        />
                      </div>
                    </>
                  )}
                  {element.type === 'chart' && (
                    <div>
                      <Label>Chart Type</Label>
                      <Select
                        value={element.chartType || 'bar'}
                        onValueChange={(value) => updateElement(element.id, { chartType: value as 'bar' | 'line' | 'pie' })}
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
                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                        placeholder="Enter image URL"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={element.styles?.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElement(element.id, { 
                        styles: { ...element.styles, backgroundColor: e.target.value }
                      })}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => deleteElement(element.id)}
                  >
                    Delete Element
                  </Button>
                </div>
              )
            })()}
          </div>
        )}
      </div>
      {message && (
        <p style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: message.startsWith('✅') ? '#22c55e' : '#ef4444',
          color: 'white',
          borderRadius: '4px'
        }}>
          {message}
        </p>
      )}
    </DndProvider>
  )
}

// Draggable Element Component
const DraggableElement = ({ 
  element, 
  moveElement, 
  children,
  isPreviewMode
}: {
  element: DashboardElement
  moveElement: (id: string, x: number, y: number) => void
  children: React.ReactNode
  isPreviewMode: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { id: element.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !isPreviewMode
  })

  const [, drop] = useDrop({
    accept: 'element',
    hover: (item: { id: string }, monitor) => {
      if (!ref.current || isPreviewMode) return
      const { id: draggedId } = item
      if (draggedId === element.id) return
      const { x, y } = getElementPosition(ref.current)
      moveElement(draggedId, x, y)
    }
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isPreviewMode ? 'default' : 'move'
      }}
    >
      {children}
    </div>
  )
}

// Helper function to get element position
const getElementPosition = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left - (el.parentElement?.getBoundingClientRect().left || 0),
    y: rect.top - (el.parentElement?.getBoundingClientRect().top || 0)
  }
}