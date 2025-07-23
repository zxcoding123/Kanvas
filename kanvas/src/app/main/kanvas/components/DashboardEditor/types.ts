// src/app/main/kanvas/components/DashboardEditor/types.ts
export type DashboardElement = {
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
    children?: string[]
    isFullWidth?: boolean
    isFullHeight?: boolean
    parentId?: string
    positionType?: 'absolute' | 'relative'
    margin?: string
    padding?: string
    data?: any[]
}

export type TableInfo = {
    name: string
    structure: { Field: string; Type: string; Null: string; Key: string; Default: string | null; Extra: string }[]
}

export type Page = {
    id: string
    name: string
    elements: DashboardElement[]
}

export type ElementTypes = 'text' | 'image' | 'chart' | 'table' | 'divider' | 'container'