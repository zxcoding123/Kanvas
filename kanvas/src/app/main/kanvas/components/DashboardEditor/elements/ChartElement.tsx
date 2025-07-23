'use client'

import { Bar, Line, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { DashboardElement } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export default function ChartElement({
  element,
  updateElement,
  isPreviewMode
}: {
  element: DashboardElement
  updateElement: (updates: Partial<DashboardElement>) => void
  isPreviewMode: boolean
}) {
  const chartData = element.data?.length ? {
    labels: element.data.map((row: any) => Object.values(row)[0]),
    datasets: [{
      label: element.tableName || 'Data',
      data: element.data.map((row: any) => Object.values(row)[1]),
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
      ],
      borderWidth: 1
    }]
  } : null

  return (
    <div className="w-full h-full p-4">
      {chartData ? (
        <div className="w-full h-full">
          {element.chartType === 'bar' && (
            <Bar data={chartData} options={{ maintainAspectRatio: false }} />
          )}
          {element.chartType === 'line' && (
            <Line data={chartData} options={{ maintainAspectRatio: false }} />
          )}
          {element.chartType === 'pie' && (
            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
          )}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          No chart data available
        </div>
      )}
    </div>
  )
}