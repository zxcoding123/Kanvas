// app/login/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-green">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="justify-center flex mb-3 ">
          <img src="/logos/1.png" alt="Icon" className="w-16 h-16 rounded  " />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-center">Login to Kanvas</h1>
        <form className="space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link href="/authentication/register" className="text-beige hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
