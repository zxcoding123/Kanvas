'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Field = {
  name: string
  type: string
  length?: string
  isPrimary?: boolean
  isNullable?: boolean
  isAutoIncrement?: boolean
  defaultValue?: string
  defaultType?: 'as_defined' | 'null' | 'current_timestamp' | ''
}

type TableInfo = {
  name: string
  structure: { Field: string; Type: string; Null: string; Key: string; Default: string | null; Extra: string }[]
}

type ConnectionInfo = {
  host: string
  port: string
  database: string
  user: string
}

const dataTypes = [
  'INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP',
  'BOOLEAN', 'FLOAT', 'DOUBLE', 'DECIMAL', 'BIGINT', 'CHAR',
  'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'TINYINT', 'SMALLINT',
  'MEDIUMINT', 'YEAR', 'TIME', 'ENUM', 'SET', 'BLOB'
]

const defaultLengths: Record<string, string> = {
  'VARCHAR': '255',
  'CHAR': '255',
  'DECIMAL': '10,2'
}

export default function CreateTablePage() {
  const [tableName, setTableName] = useState('')
  const [fields, setFields] = useState<Field[]>([{ name: '', type: 'VARCHAR', defaultType: '' }])
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [tablesMessage, setTablesMessage] = useState('')
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [loadingConnection, setLoadingConnection] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false)
  const [confirmedDone, setConfirmedDone] = useState(false)


  // Fetch existing tables
  const fetchTables = async () => {
    setLoadingTables(true)
    setTablesMessage('')
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/list-tables.php', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      if (data.success) {
        setTables(data.tables)
      } else {
        throw new Error(data.error || 'Failed to fetch tables')
      }
    } catch (error) {
      setTablesMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      console.error('Error fetching tables:', error)
    } finally {
      setLoadingTables(false)
    }
  }

  const fetchConnectionInfo = async () => {
    setLoadingConnection(true)
    setConnectionMessage('')
    try {
      const res = await fetch('http://localhost/kanvas/api/mysql/connection-info.php', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const data = await res.json()
      if (data.success) {
        setConnectionInfo(data.connection)
      } else {
        throw new Error(data.error || 'Failed to fetch connection info')
      }
    } catch (error) {
      setConnectionMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      console.error('Error fetching connection info:', error)
    } finally {
      setLoadingConnection(false)
    }
  }

  useEffect(() => {
    fetchTables()
    fetchConnectionInfo()
  }, [])

  const handleAddField = () => {
    setFields([...fields, {
      name: '',
      type: 'VARCHAR',
      isNullable: true,
      defaultType: 'as_defined'
    }])
  }

  const handleRemoveField = (index: number) => {
    const updated = [...fields]
    updated.splice(index, 1)
    setFields(updated)
  }

  const handleFieldChange = <K extends keyof Field>(
    index: number,
    key: K,
    value: Field[K]
  ) => {
    const updated = [...fields]
    updated[index][key] = value

    // Reset length when type changes if not applicable
    if (key === 'type') {
      const type = value as string
      if (!['VARCHAR', 'CHAR', 'DECIMAL'].includes(type)) {
        delete updated[index].length
      } else if (!updated[index].length) {
        updated[index].length = defaultLengths[type] || ''
      }
    }

    // Auto-increment implies primary key
    if (key === 'isAutoIncrement' && value === true) {
      updated[index].isPrimary = true
    }

    // Primary key can't be nullable
    if (key === 'isPrimary' && value === true) {
      updated[index].isNullable = false
    }

    setFields(updated)
  }

  const handleSubmit = async () => {
    setCreating(true)
    setMessage('')

    try {
      // Validate table name
      if (!tableName.trim()) {
        throw new Error('Table name is required')
      }

      // Validate fields
      for (const field of fields) {
        if (!field.name.trim()) {
          throw new Error('All fields must have a name')
        }

        if (['VARCHAR', 'CHAR', 'DECIMAL'].includes(field.type) && !field.length) {
          throw new Error(`Length is required for ${field.type} fields`)
        }

        if (field.isAutoIncrement && !field.isPrimary) {
          throw new Error('Auto-increment fields must be primary keys')
        }
      }

      const res = await fetch('http://localhost/kanvas/api/mysql/create-table.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          fields: fields.map(field => ({
            ...field,
            defaultValue: field.defaultType === 'as_defined' ? field.defaultValue :
              field.defaultType === 'null' ? null :
                field.defaultType === 'current_timestamp' ? 'CURRENT_TIMESTAMP' : undefined
          }))
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const data = await res.json()

      if (data.success) {
        setMessage(`✅ Table "${tableName}" created successfully!`)
        setTableName('')
        setFields([{ name: '', type: 'VARCHAR', defaultType: '' }])
        await fetchTables()
      } else {
        throw new Error(data.error || 'Unknown error occurred')
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      console.error('Error creating table:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleProceed = () => {
    window.location.href = 'http://localhost/kanvas'
  }

  // Add this function to handle the final confirmation
  const handleFinalConfirmation = () => {
    setConfirmedDone(true)
    setShowFinalConfirmation(false)
    handleProceed() // Proceed to the site
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#EEE3D0]">
      <Card className="w-full max-w-5xl p-6 shadow-xl">
        <CardHeader>
          <h2 className="text-xl font-bold">Table Management</h2>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Table</TabsTrigger>
              <TabsTrigger value="view" onClick={fetchTables}>View Tables</TabsTrigger>
              <TabsTrigger value="connection" onClick={fetchConnectionInfo}>Connection Info</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <div className="space-y-4">
                <div>
                  <Label>Table Name <span className="text-red-600">*</span></Label>
                  <Input
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g. users"
                    className="mt-1"
                  />
                </div>

                <h3 className="font-semibold mt-4">Fields <span className="text-red-600">*</span></h3>
                <div className="space-y-4">
                  {fields.map((field, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Name <span className="text-red-600">*</span></Label>
                        <Input
                          value={field.name}
                          onChange={(e) => handleFieldChange(i, 'name', e.target.value)}
                          placeholder="Field name"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Type <span className="text-red-600">*</span></Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => handleFieldChange(i, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {['VARCHAR', 'CHAR', 'DECIMAL'].includes(field.type) && (
                        <div className="col-span-2">
                          <Label>Length</Label>
                          <Input
                            value={field.length || ''}
                            onChange={(e) => handleFieldChange(i, 'length', e.target.value)}
                            placeholder={defaultLengths[field.type] || 'Length'}
                          />
                        </div>
                      )}

                      <div className="col-span-5 grid grid-cols-4 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`primary-${i}`}
                            checked={field.isPrimary || false}
                            onCheckedChange={(checked) => handleFieldChange(i, 'isPrimary', !!checked)}
                          />
                          <Label htmlFor={`primary-${i}`}>Primary</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`nullable-${i}`}
                            checked={field.isNullable || false}
                            onCheckedChange={(checked) => handleFieldChange(i, 'isNullable', !!checked)}
                            disabled={field.isPrimary}
                          />
                          <Label htmlFor={`nullable-${i}`}>Nullable</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`autoinc-${i}`}
                            checked={field.isAutoIncrement || false}
                            onCheckedChange={(checked) => handleFieldChange(i, 'isAutoIncrement', !!checked)}
                          />
                          <Label htmlFor={`autoinc-${i}`}>Auto Inc</Label>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveField(i)}
                          className="text-red-500"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="col-span-12 grid grid-cols-12 gap-3 mt-2">
                        <div className="col-span-3">
                          <Label>Default Value</Label>
                          <Select
                            value={field.defaultType || 'as_defined'}
                            onValueChange={(value) => handleFieldChange(i, 'defaultType', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Default type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="as_defined">As defined</SelectItem>
                              <SelectItem value="null">NULL</SelectItem>
                              {(field.type === 'TIMESTAMP' || field.type === 'DATETIME') && (
                                <SelectItem value="current_timestamp">CURRENT_TIMESTAMP</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {field.defaultType === 'as_defined' && (
                          <div className="col-span-9">
                            <Label>Value</Label>
                            <Input
                              value={field.defaultValue || ''}
                              onChange={(e) => handleFieldChange(i, 'defaultValue', e.target.value)}
                              placeholder="Default value"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Button onClick={handleAddField} variant="outline">
                      ➕ Add Field
                    </Button>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-red-600">
                      * indicates required field
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={creating || !tableName || fields.some(f => !f.name)}
                    >
                      {creating ? 'Creating...' : 'Create Table'}
                    </Button>
                  </div>

                  {message && (
                    <p className={`mt-4 text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="view">
              <div className="space-y-4">
                <h3 className="font-semibold">Existing Tables</h3>
                {loadingTables ? (
                  <p>Loading tables...</p>
                ) : tables.length === 0 ? (
                  <p>No tables found in the database.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Name</TableHead>
                        <TableHead>Columns</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tables.map((table) => (
                        <TableRow key={table.name}>
                          <TableCell>{table.name}</TableCell>
                          <TableCell>{table.structure.length}</TableCell>
                          <TableCell>
                            <details>
                              <summary>View Structure</summary>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Null</TableHead>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Extra</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {table.structure.map((column) => (
                                    <TableRow key={column.Field}>
                                      <TableCell>{column.Field}</TableCell>
                                      <TableCell>{column.Type}</TableCell>
                                      <TableCell>{column.Null}</TableCell>
                                      <TableCell>{column.Key}</TableCell>
                                      <TableCell>{column.Default ?? 'NULL'}</TableCell>
                                      <TableCell>{column.Extra}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </details>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {tablesMessage && (
                  <p className="mt-4 text-sm text-red-600">{tablesMessage}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="connection">
              <div className="space-y-4">
                <h3 className="font-semibold">Database Connection Info</h3>
                {loadingConnection ? (
                  <p>Loading connection info...</p>
                ) : connectionInfo ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="font-bold">Host:</Label> {connectionInfo.host}
                    </div>
                    <div>
                      <Label className="font-bold">Port:</Label> {connectionInfo.port}
                    </div>
                    <div>
                      <Label className="font-bold">Database:</Label> {connectionInfo.database}
                    </div>
                    <div>
                      <Label className="font-bold">User:</Label> {connectionInfo.user}
                    </div>
                  </div>
                ) : (
                  <p>No connection information available.</p>
                )}
                {connectionMessage && (
                  <p className="mt-4 text-sm text-red-600">{connectionMessage}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end gap-2">
            {tables.length > 0 && !confirmedDone && (
              <Button
                variant="outline"
                onClick={() => setShowFinalConfirmation(true)}
              >
                I'm Done Creating Tables
              </Button>
            )}

          
          </div>

          

        </CardContent>
      </Card>

      {showFinalConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Confirm Completion</h3>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {tables.length === 0
                  ? "You haven't created any tables yet. Are you sure you want to proceed?"
                  : `You've created ${tables.length} table(s). Are you sure you're done?`}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFinalConfirmation(false)}>
                  Go Back
                </Button>
                <Button variant="default" onClick={handleFinalConfirmation}>
                  Yes, Proceed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}