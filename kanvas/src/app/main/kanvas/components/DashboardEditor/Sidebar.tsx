// src/app/main/kanvas/components/DashboardEditor/Sidebar.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DashboardElement, TableInfo } from './types'

const elementTypes = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'chart', label: 'Chart', icon: '📊' },
  { type: 'table', label: 'Table', icon: '📋' },
  { type: 'divider', label: 'Divider', icon: '―' },
  { type: 'container', label: 'Container', icon: '📦' }
] as const

interface SidebarProps {
  dashboardName: string
  setDashboardName: (name: string) => void
  isPreviewMode: boolean
  setIsPreviewMode: (mode: boolean) => void
  addElement: (type: string, parentId?: string) => void
  tables: TableInfo[]
  setMessage: (message: string) => void
  selectedElement: string | null
}

// Implement these functions locally since the module isn't found
const saveDashboard = async (name: string) => {
  // Implementation here
}

const loadDashboard = async (name: string) => {
  // Implementation here
}

const exportDashboard = (name: string) => {
  // Implementation here
}

export default function Sidebar({
  dashboardName,
  setDashboardName,
  isPreviewMode,
  setIsPreviewMode,
  addElement,
  tables,
  setMessage,
  selectedElement
}: SidebarProps) {
  const handleSave = async () => {
    if (!dashboardName.trim()) {
      setMessage('❌ Dashboard name is required')
      return
    }
    try {
      await saveDashboard(dashboardName)
      setMessage(`✅ Dashboard "${dashboardName}" saved successfully`)
    } catch (error) {
      setMessage(`❌ Error saving dashboard: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleLoad = async () => {
    if (!dashboardName.trim()) {
      setMessage('❌ Dashboard name is required')
      return
    }
    try {
      await loadDashboard(dashboardName)
      setMessage(`✅ Dashboard "${dashboardName}" loaded successfully`)
    } catch (error) {
      setMessage(`❌ Error loading dashboard: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExport = () => {
    exportDashboard(dashboardName)
    setMessage('✅ Dashboard exported successfully')
  }

  return (
    <div className="w-64 bg-green-600 text-white p-5 flex flex-col">
      <h2 className="text-xl font-bold mb-5">Dashboard Builder</h2>
      
      <div className="mb-5">
        <Label className="block mb-1">Dashboard Name</Label>
        <Input
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          placeholder="Enter dashboard name"
          className="w-full text-black"
        />
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} className="flex-1">Save</Button>
          <Button onClick={handleLoad} variant="outline" className="flex-1">Load</Button>
          <Button onClick={handleExport} variant="secondary" className="flex-1">Export</Button>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Elements</h3>
      <div className="space-y-2 mb-5">
        {elementTypes.map((item) => (
          <div
            key={item.type}
            className="p-3 bg-beige-500 rounded cursor-pointer flex items-center gap-2 hover:bg-beige-600"
            onClick={() => addElement(item.type, selectedElement || undefined)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Label>Mode</Label>
        <div className="flex items-center gap-2 mt-1">
          <Switch
            checked={isPreviewMode}
            onCheckedChange={setIsPreviewMode}
          />
          <span>{isPreviewMode ? 'Preview' : 'Edit'}</span>
        </div>
      </div>
    </div>
  )
}