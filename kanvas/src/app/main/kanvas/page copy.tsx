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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, Underline, Heading1, Heading2, Heading3, Pilcrow } from 'lucide-react'
import { Chart as ChartJS, ArcElement, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

type ChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor?: string;
    }[];
};

// Define types for dashboard elements
type DashboardElement = {
    id: string
    type: 'text' | 'image' | 'chart' | 'table' | 'divider' | 'container'
    content?: string
    x: number
    y: number
    width: number | 'auto' | '100%'
    height: number | 'auto' | '100%'
    styles?: React.CSSProperties
    tableName?: string
    chartType?: 'bar' | 'line' | 'pie'
    query?: string
    textType?: 'paragraph' | 'h1' | 'h2' | 'h3'
    textFormat?: ('bold' | 'italic' | 'underline')[]
    children?: string[] // IDs of child elements
    isFullWidth?: boolean
    isFullHeight?: boolean
    parentId?: string // For elements inside containers
    positionType?: 'absolute' | 'relative'
    margin?: string // Added margin property
    padding?: string // Added padding property
    data?: any[] // Added for table/chart data
}

type TableInfo = {
    name: string
    structure: { Field: string; Type: string; Null: string; Key: string; Default: string | null; Extra: string }[]
}

// Element types available in the sidebar
const elementTypes = [
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'image', label: 'Image', icon: '🖼️' },
    { type: 'chart', label: 'Chart', icon: '📊' },
    { type: 'table', label: 'Table', icon: '📋' },
    { type: 'divider', label: 'Divider', icon: '―' },
    { type: 'container', label: 'Container', icon: '📦' }
]

const textTypes = [
    { value: 'paragraph', label: 'Paragraph', icon: <Pilcrow size={16} /> },
    { value: 'h1', label: 'Heading 1', icon: <Heading1 size={16} /> },
    { value: 'h2', label: 'Heading 2', icon: <Heading2 size={16} /> },
    { value: 'h3', label: 'Heading 3', icon: <Heading3 size={16} /> }
]

interface Page {
    id: string;
    name: string;
    elements: DashboardElement[];
}

const chartTypes = ['bar', 'line', 'pie']
const GRID_SIZE = 10 // Grid snapping size in pixels

export default function DashboardEditor() {
    const [pages, setPages] = useState<Page[]>([{ id: 'page-1', name: 'Page 1', elements: [] }]);
    const [currentPageId, setCurrentPageId] = useState<string>('page-1');
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
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
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

    // Fetch data for table or chart
    const fetchData = async (query: string, elementId: string) => {
        try {
            const res = await fetch('http://localhost/kanvas/api/mysql/execute-query.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            })
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
            const data = await res.json()
            if (data.success) {
                setElements(prev => prev.map(el =>
                    el.id === elementId ? { ...el, data: data.results } : el
                ))
            } else {
                throw new Error(data.error || 'Failed to fetch data')
            }
        } catch (error) {
            setMessage(`❌ Error fetching data: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    // Load saved dashboard
    const loadDashboard = async () => {
        if (!dashboardName.trim()) {
            setMessage('❌ Dashboard name is required')
            return
        }
        try {
            const res = await fetch('http://localhost/kanvas/api/mysql/dashboard.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'load', dashboardName })
            })
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
            const data = await res.json()
            if (data.success) {
                const loadedElements = data.dashboard.elements || []
                setElements(loadedElements)
                // Fetch data for tables and charts
                loadedElements.forEach((el: DashboardElement) => {
                    if ((el.type === 'table' || el.type === 'chart') && el.query) {
                        fetchData(el.query, el.id)
                    }
                })
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
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
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

    // Export dashboard as JSON
    const exportDashboard = () => {
        const dashboardData = {
            dashboardName,
            elements
        }
        const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${dashboardName || 'dashboard'}.json`
        a.click()
        URL.revokeObjectURL(url)
        setMessage('✅ Dashboard exported successfully')
    }

    // Fetch tables on mount
    useEffect(() => {
        fetchTables()
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedElement && !isPreviewMode) {
                deleteElement(selectedElement);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, isPreviewMode]);

    // Add new element below the last element
    const addElement = (type: DashboardElement['type'], parentId?: string) => {
        const siblings = parentId
            ? elements.filter(el => el.parentId === parentId)
            : elements.filter(el => !el.parentId)
        const lastElement = siblings.sort((a, b) => b.y + (typeof b.height === 'number' ? b.height : 150) - (a.y + (typeof a.height === 'number' ? a.height : 150)))[0]

        let x = parentId ? 10 : 100
        let y = parentId ? 10 : 100
        if (lastElement) {
            x = lastElement.x
            y = lastElement.y + (typeof lastElement.height === 'number' ? lastElement.height : 150) + 10
        }

        const newElement: DashboardElement = {
            id: `element-${Date.now()}`,
            type,
            content: type === 'text' ? 'New Text' : type === 'container' ? '' : undefined,
            x: Math.round(x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(y / GRID_SIZE) * GRID_SIZE,
            width: type === 'divider' ? 300 : type === 'container' ? 400 : 200,
            height: type === 'divider' ? 2 : type === 'container' ? 300 : 150,
            styles: {
                backgroundColor: type === 'text' ? 'var(--slight-white-color)' : type === 'container' ? 'rgba(210, 210, 210, 0.2)' : 'transparent',
                border: type !== 'divider' ? '1px dashed var(--green-color)' : 'none',
                borderRadius: '4px',
                padding: type === 'container' ? '10px' : '0px',
                margin: '0px' // Added default margin
            },
            tableName: type === 'table' || type === 'chart' ? (tables[0]?.name || '') : undefined,
            chartType: type === 'chart' ? 'bar' : undefined,
            query: type === 'table' || type === 'chart' ? `SELECT * FROM ${tables[0]?.name || ''} LIMIT 10` : undefined,
            textType: type === 'text' ? 'paragraph' : undefined,
            textFormat: type === 'text' ? [] : undefined,
            children: type === 'container' ? [] : undefined,
            isFullWidth: false,
            isFullHeight: false,
            parentId,
            positionType: 'relative',
            margin: '0px', // Added margin
            padding: type === 'container' ? '10px' : '0px', // Added padding
            data: type === 'table' || type === 'chart' ? [] : undefined
        }

        if (type === 'table' || type === 'chart') {
            fetchData(newElement.query || '', newElement.id)
        }

        if (parentId) {
            setElements(prev => prev.map(el =>
                el.id === parentId
                    ? { ...el, children: [...(el.children || []), newElement.id] }
                    : el
            ))
        }

        setElements([...elements, newElement])
    }

    // Update element properties
    const updateElement = (id: string, updates: Partial<DashboardElement>) => {
        setElements(elements.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ))
        if (updates.query && (updates.tableName || elements.find(el => el.id === id)?.type === 'table' || elements.find(el => el.id === id)?.type === 'chart')) {
            fetchData(updates.query || '', id)
        }
    }

    // Move element with grid snapping
    const moveElement = (id: string, x: number, y: number) => {
        const element = elements.find(el => el.id === id)
        if (!element) return

        const parent = element.parentId ? elements.find(el => el.id === element.parentId) : null
        const parentWidth = parent ? (parent.isFullWidth ? dashboardRef.current?.clientWidth || 1000 : typeof parent.width === 'number' ? parent.width : 400) : (dashboardRef.current?.clientWidth || 1000)
        const parentHeight = parent ? (parent.isFullHeight ? dashboardRef.current?.clientHeight || 1000 : typeof parent.height === 'number' ? parent.height : 300) : (dashboardRef.current?.clientHeight || 1000)

        const newX = Math.round(Math.max(0, Math.min(x, parentWidth - (typeof element.width === 'number' ? element.width : 200))) / GRID_SIZE) * GRID_SIZE
        const newY = Math.round(Math.max(0, Math.min(y, parentHeight - (typeof element.height === 'number' ? element.height : 150))) / GRID_SIZE) * GRID_SIZE

        setElements(elements.map(el =>
            el.id === id ? { ...el, x: newX, y: newY } : el
        ))
    }

    // Resize element with grid snapping
    const resizeElement = (id: string, direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw', deltaX: number, deltaY: number) => {
        setElements(elements.map(el => {
            if (el.id !== id || el.isFullWidth || el.isFullHeight) return el

            const newElement = { ...el }
            const minWidth = 50
            const minHeight = el.type === 'divider' ? 2 : 30

            const snapDeltaX = Math.round(deltaX / GRID_SIZE) * GRID_SIZE
            const snapDeltaY = Math.round(deltaY / GRID_SIZE) * GRID_SIZE

            switch (direction) {
                case 'e':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width + snapDeltaX : 200)
                    break
                case 'w':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width - snapDeltaX : 200)
                    newElement.x = Math.round(Math.max(0, el.x + snapDeltaX) / GRID_SIZE) * GRID_SIZE
                    break
                case 's':
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height + snapDeltaY : 150)
                    break
                case 'n':
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height - snapDeltaY : 150)
                    newElement.y = Math.round(Math.max(0, el.y + snapDeltaY) / GRID_SIZE) * GRID_SIZE
                    break
                case 'se':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width + snapDeltaX : 200)
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height + snapDeltaY : 150)
                    break
                case 'sw':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width - snapDeltaX : 200)
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height + snapDeltaY : 150)
                    newElement.x = Math.round(Math.max(0, el.x + snapDeltaX) / GRID_SIZE) * GRID_SIZE
                    break
                case 'ne':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width + snapDeltaX : 200)
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height - snapDeltaY : 150)
                    newElement.y = Math.round(Math.max(0, el.y + snapDeltaY) / GRID_SIZE) * GRID_SIZE
                    break
                case 'nw':
                    newElement.width = Math.max(minWidth, typeof el.width === 'number' ? el.width - snapDeltaX : 200)
                    newElement.height = Math.max(minHeight, typeof el.height === 'number' ? el.height - snapDeltaY : 150)
                    newElement.x = Math.round(Math.max(0, el.x + snapDeltaX) / GRID_SIZE) * GRID_SIZE
                    newElement.y = Math.round(Math.max(0, el.y + snapDeltaY) / GRID_SIZE) * GRID_SIZE
                    break
            }

            return newElement
        }))
    }

    // Delete element
    const deleteElement = (id: string) => {
        const deleteNested = (elementId: string) => {
            const element = elements.find(el => el.id === elementId)
            if (element?.children) {
                element.children.forEach(childId => deleteNested(childId))
            }
            setElements(prev => prev.filter(el => el.id !== elementId))
        }

        deleteNested(id)
        setElements(prev => prev.map(el => ({
            ...el,
            children: el.children?.filter(childId => childId !== id)
        })))
        if (selectedElement === id) {
            setSelectedElement(null)
        }
    }

    // Handle element selection
    const selectElement = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedElement(id === selectedElement ? null : id)
    }

    // Render resize handles
    const renderResizeHandles = (element: DashboardElement, isResizing: boolean, setIsResizing: (value: boolean) => void) => {
        if (isPreviewMode || element.type === 'divider' || element.isFullWidth || element.isFullHeight) return null

        const handleSize = 8
        const positions = [
            { id: 'n', x: '50%', y: '0%', cursor: 'ns-resize' },
            { id: 's', x: '50%', y: '100%', cursor: 'ns-resize' },
            { id: 'e', x: '100%', y: '50%', cursor: 'ew-resize' },
            { id: 'w', x: '0%', y: '50%', cursor: 'ew-resize' },
            { id: 'ne', x: '100%', y: '0%', cursor: 'nesw-resize' },
            { id: 'nw', x: '0%', y: '0%', cursor: 'nwse-resize' },
            { id: 'se', x: '100%', y: '100%', cursor: 'nwse-resize' },
            { id: 'sw', x: '0%', y: '100%', cursor: 'nesw-resize' }
        ]

        return (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                {positions.map(pos => (
                    <div
                        key={pos.id}
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            width: `${handleSize}px`,
                            height: `${handleSize}px`,
                            backgroundColor: 'var(--green-color)',
                            borderRadius: '50%',
                            cursor: pos.cursor,
                            zIndex: 10,
                            display: selectedElement === element.id ? 'block' : 'none',
                            pointerEvents: 'auto'
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsResizing(true)
                            const startX = e.clientX
                            const startY = e.clientY

                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX
                                const deltaY = moveEvent.clientY - startY
                                resizeElement(element.id, pos.id as any, deltaX, deltaY)
                            }

                            const handleMouseUp = () => {
                                setIsResizing(false)
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                            }

                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                        }}
                    />
                ))}
            </div>
        )
    }

    // Render text element with formatting
    const renderTextElement = (element: DashboardElement) => {
        const isSelected = element.id === selectedElement
        const Tag = element.textType === 'h1' ? 'h1' :
            element.textType === 'h2' ? 'h2' :
                element.textType === 'h3' ? 'h3' : 'p'

        const textStyles: React.CSSProperties = {
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
            <div style={{
                width: '100%',
                height: '100%',
                padding: element.padding || '8px',
                margin: element.margin || '0px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {isSelected && !isPreviewMode && (
                    <div style={{ marginBottom: '8px' }}>
                        <ToggleGroup
                            type="multiple"
                            value={element.textFormat || []}
                            onValueChange={(value) => updateElement(element.id, {
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
                    onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
                    suppressContentEditableWarning
                >
                    {element.content}
                </Tag>
            </div>
        )
    }

    // Render container
    const renderContainer = (element: DashboardElement, isResizing: boolean, setIsResizing: (value: boolean) => void) => {
        const isSelected = element.id === selectedElement
        const childElements = elements.filter(el => element.children?.includes(el.id))

        return (
            <div
                style={{
                    position: element.positionType || 'absolute',
                    left: element.positionType === 'absolute' ? `${element.x}px` : undefined,
                    top: element.positionType === 'absolute' ? `${element.y}px` : undefined,
                    width: element.isFullWidth ? '100%' : typeof element.width === 'number' ? `${element.width}px` : 'auto',
                    height: element.isFullHeight ? '100%' : typeof element.height === 'number' ? element.height + (childElements.length > 0 ? 50 : 0) : 'auto',
                    backgroundColor: element.styles?.backgroundColor || 'rgba(210, 210, 210, 0.2)',
                    border: isSelected && !isPreviewMode ? '2px solid var(--green-color)' : element.styles?.border,
                    borderRadius: element.styles?.borderRadius,
                    padding: element.padding || element.styles?.padding || '10px',
                    margin: element.margin || '0px',
                    overflow: 'auto',
                    cursor: isPreviewMode ? 'default' : 'move',
                    display: element.positionType === 'relative' ? 'block' : 'flex',
                    flexDirection: 'column',
                    minHeight: childElements.length > 0 ? undefined : '100px'
                }}
                onClick={(e) => !isPreviewMode && selectElement(element.id, e)}
            >
                {childElements.map(child => (
                    <DraggableElement
                        key={child.id}
                        element={child}
                        moveElement={moveElement}
                        isPreviewMode={isPreviewMode}
                        isResizing={isResizing}
                        setIsResizing={setIsResizing}
                    >
                        {renderElement(child, isResizing, setIsResizing)}
                    </DraggableElement>
                ))}
                {isSelected && !isPreviewMode && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '10px' }}>
                        <Select onValueChange={(type) => addElement(type as DashboardElement['type'], element.id)}>
                            <SelectTrigger style={{ width: '150px' }}>
                                <SelectValue placeholder="Add Element" />
                            </SelectTrigger>
                            <SelectContent>
                                {elementTypes.map(item => (
                                    <SelectItem key={item.type} value={item.type}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {renderResizeHandles(element, isResizing, setIsResizing)}
            </div>
        )
    }

    const renderChart = (element: DashboardElement, isResizing: boolean, setIsResizing: (value: boolean) => void) => {
        const isSelected = element.id === selectedElement;

        // Prepare chart data from element.data
        let chartData = null;
        if (element.data && element.data.length > 0) {
            const labels = element.data.map((row: any) => {
                const firstKey = Object.keys(row)[0];
                return row[firstKey] || 'Unknown';
            });
            const values = element.data.map((row: any) => {
                const secondKey = Object.keys(row)[1] || Object.keys(row)[0];
                return Number(row[secondKey]) || 0;
            });

            chartData = {
                labels,
                datasets: [
                    {
                        label: element.tableName || 'Data',
                        data: values,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(153, 102, 255, 1)',
                        ],
                        borderWidth: 1,
                    },
                ],
            };
        }

        return (
            <div
                style={{
                    position: element.positionType || 'absolute',
                    left: element.positionType === 'absolute' ? `${element.x}px` : undefined,
                    top: element.positionType === 'absolute' ? `${element.y}px` : undefined,
                    width: element.isFullWidth ? '100%' : typeof element.width === 'number' ? `${element.width}px` : 'auto',
                    height: element.isFullHeight ? '100%' : typeof element.height === 'number' ? `${element.height}px` : 'auto',
                    backgroundColor: 'var(--slight-white-color)',
                    border: isSelected && !isPreviewMode ? '2px solid var(--green-color)' : element.styles?.border,
                    padding: element.padding || '8px',
                    margin: element.margin || '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isPreviewMode || isResizing ? 'default' : 'move',
                    overflow: 'hidden',
                }}
                onClick={(e) => !isPreviewMode && selectElement(element.id, e)}
            >
                {chartData ? (
                    <>
                        {element.chartType === 'bar' && (
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' },
                                        title: { display: true, text: element.tableName || 'Chart' },
                                    },
                                }}
                            />
                        )}
                        {element.chartType === 'line' && (
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' },
                                        title: { display: true, text: element.tableName || 'Chart' },
                                    },
                                }}
                            />
                        )}
                        {element.chartType === 'pie' && (
                            <Pie
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top' },
                                        title: { display: true, text: element.tableName || 'Chart' },
                                    },
                                }}
                            />
                        )}
                    </>
                ) : (
                    <span style={{ fontFamily: 'var(--font-poppins)' }}>
                        No data available for {element.tableName || 'chart'}
                    </span>
                )}
                {renderResizeHandles(element, isResizing, setIsResizing)}
            </div>
        );
    };

    // Render table
    const renderTable = (element: DashboardElement, isResizing: boolean, setIsResizing: (value: boolean) => void) => {
        const isSelected = element.id === selectedElement
        const tableStructure = tables.find(t => t.name === element.tableName)?.structure || []

        return (
            <div
                style={{
                    position: element.positionType || 'absolute',
                    left: element.positionType === 'absolute' ? `${element.x}px` : undefined,
                    top: element.positionType === 'absolute' ? `${element.y}px` : undefined,
                    width: element.isFullWidth ? '100%' : typeof element.width === 'number' ? `${element.width}px` : 'auto',
                    height: element.isFullHeight ? '100%' : typeof element.height === 'number' ? `${element.height}px` : 'auto',
                    padding: element.padding || '8px',
                    margin: element.margin || '0px',
                    overflow: 'auto',
                    border: isSelected && !isPreviewMode ? '2px solid var(--green-color)' : element.styles?.border,
                    cursor: isPreviewMode || isResizing ? 'default' : 'move'
                }}
                onClick={(e) => !isPreviewMode && selectElement(element.id, e)}
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            {tableStructure.map(col => (
                                <TableHead key={col.Field}>{col.Field}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {element.data && element.data.length > 0 ? (
                            element.data.map((row, index) => (
                                <TableRow key={index}>
                                    {tableStructure.map(col => (
                                        <TableCell key={col.Field}>{row[col.Field] || ''}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={tableStructure.length || 1}>
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {renderResizeHandles(element, isResizing, setIsResizing)}
            </div>
        )
    }

    // Render element based on type
    const renderElement = (element: DashboardElement, isResizing: boolean, setIsResizing: (value: boolean) => void) => {

        const isSelected = element.id === selectedElement
        const childElements = elements.filter(el => element.children?.includes(el.id))

        const baseStyles: React.CSSProperties = {
            position: element.positionType || (element.parentId ? 'absolute' : 'absolute'),
            left: element.positionType === 'absolute' ? `${element.x}px` : undefined,
            top: element.positionType === 'absolute' ? `${element.y}px` : undefined,
            width: element.isFullWidth ? '100%' : typeof element.width === 'number' ? `${element.width}px` : 'auto',
            height: element.isFullHeight ? '100%' : typeof element.height === 'number' ? `${element.height}px` : 'auto',
            cursor: isPreviewMode || isResizing ? 'default' : 'move',
            ...element.styles,
            border: isSelected && !isPreviewMode ? '2px solid var(--green-color)' : element.styles?.border,
            margin: element.margin || '0px',
            padding: element.padding || '0px',
            display: element.positionType === 'relative' ? 'block' : undefined
        }

        switch (element.type) {
            case 'text':
                return (
                    <div style={baseStyles} onClick={(e) => !isPreviewMode && selectElement(element.id, e)}>
                        {renderTextElement(element)}
                        {renderResizeHandles(element, isResizing, setIsResizing)}
                    </div>
                )
            case 'image':
                return (
                    <div
                        style={{
                            ...baseStyles,
                            backgroundImage: element.content ? `url(${element.content})` : 'url(https://via.placeholder.com/200x150)',
                            backgroundSize: 'cover',
                            margin: element.margin || '0px',
                            padding: element.padding || '0px'
                        }}
                        onClick={(e) => !isPreviewMode && selectElement(element.id, e)}
                    >
                        {renderResizeHandles(element, isResizing, setIsResizing)}
                    </div>
                )
            case 'chart':
                return renderChart(element, isResizing, setIsResizing)
            case 'table':
                return renderTable(element, isResizing, setIsResizing)
            case 'divider':
                return (
                    <div
                        style={{
                            ...baseStyles,
                            backgroundColor: 'var(--green-color)',
                            height: '2px',
                            margin: element.margin || '0px'
                        }}
                        onClick={(e) => !isPreviewMode && selectElement(element.id, e)}
                    />
                )
            case 'container':
                return renderContainer(element, isResizing, setIsResizing)
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
                            <Button onClick={exportDashboard} variant="secondary">Export</Button>
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
                                onClick={() => addElement(item.type as DashboardElement['type'], selectedElement && elements.find(el => el.id === selectedElement)?.type === 'container' ? selectedElement : undefined)}
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
                        width: '100%',
                        position: 'relative',
                        backgroundColor: 'white',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        padding: '20px'
                    }}>
                        {elements.filter(el => !el.parentId).map((element) => (
                            <DraggableElement
                                key={element.id}
                                element={element}
                                moveElement={moveElement}
                                isPreviewMode={isPreviewMode}
                                isResizing={false}
                                setIsResizing={() => { }}
                            >
                                {renderElement(element, false, () => { })}
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
                                    {element.positionType !== 'relative' && (
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
                                    )}
                                    <div>
                                        <Label>Size</Label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Select
                                                value={typeof element.width === 'number' ? element.width.toString() : element.width}
                                                onValueChange={(value) => updateElement(element.id, {
                                                    width: value === 'auto' || value === '100%' ? value : Number(value),
                                                    isFullWidth: value === '100%'
                                                })}
                                            >
                                                <SelectTrigger style={{ width: '100px' }}>
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
                                                onValueChange={(value) => updateElement(element.id, {
                                                    height: value === 'auto' || value === '100%' ? value : Number(value),
                                                    isFullHeight: value === '100%'
                                                })}
                                            >
                                                <SelectTrigger style={{ width: '100px' }}>
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
                                            onValueChange={(value) => updateElement(element.id, { positionType: value as 'absolute' | 'relative' })}
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
                                            onChange={(e) => updateElement(element.id, { margin: e.target.value })}
                                            placeholder="e.g., 10px or 10px 20px"
                                        />
                                    </div>
                                    <div>
                                        <Label>Padding</Label>
                                        <Input
                                            value={element.padding || '0px'}
                                            onChange={(e) => updateElement(element.id, { padding: e.target.value })}
                                            placeholder="e.g., 10px or 10px 20px"
                                        />
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
                                    {element.type === 'text' && (
                                        <>
                                            <div>
                                                <Label>Text Type</Label>
                                                <Select
                                                    value={element.textType || 'paragraph'}
                                                    onValueChange={(value) => updateElement(element.id, { textType: value as 'paragraph' | 'h1' | 'h2' | 'h3' })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select text type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {textTypes.map(type => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                                    onValueChange={(value) => updateElement(element.id, { textFormat: value as ('bold' | 'italic' | 'underline')[] })}
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
                                    {(element.type === 'container') && (
                                        <>
                                            <div>
                                                <Label>Layout</Label>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                                    <Switch
                                                        checked={element.isFullWidth || false}
                                                        onCheckedChange={(checked) => updateElement(element.id, { isFullWidth: checked, width: checked ? '100%' : 400 })}
                                                    />
                                                    <span>Full Width</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                                    <Switch
                                                        checked={element.isFullHeight || false}
                                                        onCheckedChange={(checked) => updateElement(element.id, { isFullHeight: checked, height: checked ? '100%' : 300 })}
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
    isPreviewMode,
    isResizing,
    setIsResizing
}: {
    element: DashboardElement
    moveElement: (id: string, x: number, y: number) => void
    children: React.ReactNode
    isPreviewMode: boolean
    isResizing: boolean
    setIsResizing: (value: boolean) => void
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [localIsResizing, setLocalIsResizing] = useState(isResizing)

    const [{ isDragging }, drag] = useDrag({
        type: 'element',
        item: { id: element.id, parentId: element.parentId },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        canDrag: !isPreviewMode && !localIsResizing && element.positionType !== 'relative'
    })

    const [, drop] = useDrop({
        accept: 'element',
        hover: (item: { id: string, parentId?: string }, monitor) => {
            if (!ref.current || isPreviewMode || element.type !== 'container') return
            const { id: draggedId, parentId } = item
            if (draggedId === element.id) return

            const clientOffset = monitor.getClientOffset()
            if (!clientOffset) return

            const containerRect = ref.current.getBoundingClientRect()
            const x = clientOffset.x - containerRect.left
            const y = clientOffset.y - containerRect.top


        }
    })



    return (
        <div
            ref={ref}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: isPreviewMode || localIsResizing ? 'default' : 'move'
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