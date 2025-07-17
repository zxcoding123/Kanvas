import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function POST(req: Request) {
  const body = await req.json()
  const { host, port, username, password, database } = body

  try {
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user: username,
      password,
      database,
    })

    await connection.query('SELECT 1') // Simple test query
    await connection.end()

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Connection error:', e)
    return NextResponse.json({ success: false })
  }
}
