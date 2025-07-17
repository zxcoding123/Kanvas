'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'connection' | 'database'>('connection')

  // Connection form state
  const [dbType, setDbType] = useState('mysql')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('3306')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Database creation state
  const [databaseName, setDatabaseName] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<null | 'success' | 'error'>(null)
  const [creationStatus, setCreationStatus] = useState<null | 'success' | 'error'>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [canProceed, setCanProceed] = useState(false) // New state to control proceeding

  // Validate connection form
  const validateConnection = () => {
    const newErrors: Record<string, string> = {}
    
    if (!host.trim()) {
      newErrors.host = 'Host is required'
    } else if (!/^([a-zA-Z0-9.-]+|localhost)$/.test(host)) {
      newErrors.host = 'Invalid host format'
    }
    
    if (!port.trim()) {
      newErrors.port = 'Port is required'
    } else if (!/^\d+$/.test(port)) {
      newErrors.port = 'Port must be a number'
    } else if (parseInt(port) <= 0 || parseInt(port) > 65535) {
      newErrors.port = 'Port must be between 1 and 65535'
    }
    
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate database creation form
  const validateDatabase = () => {
    const newErrors: Record<string, string> = {}
    
    if (!databaseName.trim()) {
      newErrors.databaseName = 'Database name is required'
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(databaseName)) {
      newErrors.databaseName = 'Invalid database name (letters, numbers, underscores only)'
    } else if (databaseName.length > 64) {
      newErrors.databaseName = 'Database name too long (max 64 characters)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTestConnection = async () => {
    if (!validateConnection()) return
    
    setIsTesting(true)
    setConnectionStatus(null)
    setCanProceed(false) // Reset proceed state when testing new connection

    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/ping-server.php', {
        method: 'POST',
        body: JSON.stringify({ host, port, username, password }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (data.success) {
        setConnectionStatus('success')
        setCanProceed(true) // Only allow proceeding after explicit user action
      } else {
        setConnectionStatus('error')
        setErrors({
          ...errors,
          server: data.error || 'Failed to connect to database server'
        })
      }
    } catch (e) {
      setConnectionStatus('error')
      setErrors({
        ...errors,
        server: 'Network error occurred. Please try again.'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleProceedToDatabase = () => {
    if (connectionStatus === 'success') {
      setStep('database')
    }
  }

  const handleCreateDatabase = async () => {
    if (!validateDatabase()) return
    
    setIsCreating(true)
    setCreationStatus(null)

    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/create-database.php', {
        method: 'POST',
        body: JSON.stringify({ 
          host, 
          port, 
          username, 
          password,
          databaseName 
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (data.success) {
        setCreationStatus('success')
        // Store connection details in localStorage or context
        localStorage.setItem('dbConfig', JSON.stringify({
          host,
          port,
          username,
          password,
          database: databaseName
        }))
        router.push('/main/onboarding/create-table/')
      } else {
        setCreationStatus('error')
        setErrors({
          ...errors,
          database: data.error || 'Failed to create database'
        })
      }
    } catch (e) {
      setCreationStatus('error')
      setErrors({
        ...errors,
        database: 'Network error occurred. Please try again.'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleBackToConnection = () => {
    setStep('connection')
    setCreationStatus(null)
    setErrors({})
    setCanProceed(false)
  }

  // Clear errors when input changes
  useEffect(() => {
    if (errors.host && host) setErrors(prev => ({ ...prev, host: '' }))
    if (errors.port && port) setErrors(prev => ({ ...prev, port: '' }))
    if (errors.username && username) setErrors(prev => ({ ...prev, username: '' }))
    if (errors.databaseName && databaseName) setErrors(prev => ({ ...prev, databaseName: '' }))
  }, [host, port, username, databaseName, errors])

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#D1A980]">
      <Card className="w-full max-w-xl shadow-lg p-6">
        <CardHeader>
          <img src="/logos/1.png" alt="Icon" className="w-16 h-16 rounded" />
          <h1 className="text-2xl font-semibold mb-2">
            {step === 'connection' ? 'Database Connection' : 'Create Database'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'connection' 
              ? 'Connect to your database server to continue'
              : 'Create a new database to store your data'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'connection' ? (
            <>
              <div>
                <Label>Database Type</Label>
                <select
                  title="type"
                  className="w-full p-2 mt-1 border rounded"
                  value={dbType}
                  onChange={(e) => setDbType(e.target.value.toLowerCase())}
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql" disabled>PostgreSQL (coming soon)</option>
                  <option value="mongodb" disabled>MongoDB (coming soon)</option>
                </select>
              </div>

              <div>
                <Label>Host</Label>
                <Input 
                  value={host} 
                  onChange={(e) => setHost(e.target.value)} 
                  placeholder="127.0.0.1" 
                  className={errors.host ? 'border-red-500' : ''}
                />
                {errors.host && <p className="text-red-500 text-xs mt-1">{errors.host}</p>}
              </div>

              <div>
                <Label>Port</Label>
                <Input 
                  value={port} 
                  onChange={(e) => setPort(e.target.value)} 
                  placeholder="3306" 
                  className={errors.port ? 'border-red-500' : ''}
                />
                {errors.port && <p className="text-red-500 text-xs mt-1">{errors.port}</p>}
              </div>

              <div>
                <Label>Username</Label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="root" 
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your DB password"
                />
              </div>

              {errors.server && (
                <p className="text-red-500 text-xs mt-1">{errors.server}</p>
              )}

              <div className="flex justify-between mt-4">
                <div>
                  {connectionStatus === 'success' && (
                    <Button 
                      onClick={handleProceedToDatabase}
                      variant="default"
                    >
                      Proceed to Database Setup
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleTestConnection} 
                  disabled={isTesting || !host || !port || !username}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {connectionStatus === 'success' && (
                <p className="text-green-600 text-sm mt-2">✅ Connection successful! Click "Proceed" to continue</p>
              )}
              {connectionStatus === 'error' && !errors.server && (
                <p className="text-red-600 text-sm mt-2">❌ Failed to connect. Please check your credentials.</p>
              )}
            </>
          ) : (
            <>
              <div>
                <Label>Database Name</Label>
                <Input
                  value={databaseName}
                  onChange={(e) => setDatabaseName(e.target.value)}
                  placeholder="e.g. kanvas_db"
                  className={errors.databaseName ? 'border-red-500' : ''}
                />
                {errors.databaseName && <p className="text-red-500 text-xs mt-1">{errors.databaseName}</p>}
              </div>

              {errors.database && (
                <p className="text-red-500 text-xs mt-1">{errors.database}</p>
              )}

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handleBackToConnection}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreateDatabase} 
                  disabled={isCreating || !databaseName}
                >
                  {isCreating ? 'Creating...' : 'Create Database'}
                </Button>
              </div>

              {creationStatus === 'success' && (
                <p className="text-green-600 text-sm mt-2">✅ Database created successfully!</p>
              )}
              {creationStatus === 'error' && !errors.database && (
                <p className="text-red-600 text-sm mt-2">❌ Failed to create database. Please try again.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}