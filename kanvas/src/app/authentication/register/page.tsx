'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { Label } from '@radix-ui/react-label'

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Registering user:', form)
      await new Promise((res) => setTimeout(res, 1000))
      alert('Registered!')
    } catch (err) {
      setError('Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-green">
      <Card className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 overflow-hidden p-10">
        {/* Left - Features */}
        <div className="bg-green text-white p-8 flex flex-col justify-center space-y-4">
          <h2 className="text-3xl font-bold">Welcome to Kanvas</h2>
          <p className="text-lg">
            Build and customize dashboards visually — no code needed.
          </p>
          <ul className="space-y-2 text-sm">
            <li>✅ Drag-and-drop widgets</li>
            <li>✅ Connect to APIs or databases</li>
            <li>✅ Collaborate with your team</li>
            <li>✅ Secure, beautiful dashboards</li>
          </ul>
        </div>

        {/* Right - Form */}
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <h2 className="text-2xl font-bold">Create your Kanvas account</h2>
            <p className='text-1xl font-light mb-3'>Create your account to proceed and use Kanvas.</p>
          </CardHeader>

          <CardContent className="space-y-4 px-8">
            <Label
              className='mb-2 p-1 text-sm'>
              Full Name
            </Label>
            <Input
              name="name"
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className='mb-3'
            />
            <Label
              className='mb-2 p-1 text-sm'>
              Email Address
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="Enter your email here"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Label
              className='mb-2 p-1 text-sm'>
              Password
            </Label>
            <Input
              name="password"
              type="password"
              placeholder="Enter your password here"
              value={form.password}
              onChange={handleChange}
              required
            />

            <p className="mb-1 text-sm text-muted-foreground">
              Make sure your password contains:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
              <li>At least 1 uppercase letter</li>
              <li>At least 1 lowercase letter</li>
              <li>At least 1 number</li>
              <li>At least 1 special character (e.g. !@#$%^&*)</li>
              <li>Minimum of 8 characters</li>
            </ul>

            <Label
              className='mb-2 p-1 text-sm'>
              Position
            </Label>
            <select
              name="position"
              className='w-full px-3 py-2 border rounded-md text'
              title='position'
            >
              <option>Select a position from below</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Software Engineer">Web Designer</option>
            </select>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="terms"
                id="terms"
                required
                className="h-4 w-4 border-gray-300 rounded text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the <a href="/terms" className="underline text-primary">Terms and Conditions</a>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>

          <CardFooter className="flex flex-col items-center px-8 space-y-2 pb-8">
            <Button type="submit" className="w-full mt-10" disabled={loading}>
              {loading ? 'Registering...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/authentication/login" className="text-primary underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
