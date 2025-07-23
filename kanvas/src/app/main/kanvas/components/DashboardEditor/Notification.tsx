// src/app/main/kanvas/components/DashboardEditor/Notification.tsx
'use client'

export default function Notification({ 
  message, 
  clearMessage 
}: { 
  message: string, 
  clearMessage: () => void 
}) {
  if (!message) return null

  const isSuccess = message.startsWith('✅')
  
  return (
    <div 
      className={`fixed bottom-5 right-5 p-3 rounded shadow-lg text-white ${
        isSuccess ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button 
          onClick={clearMessage}
          className="ml-4 text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
    </div>
  )
}