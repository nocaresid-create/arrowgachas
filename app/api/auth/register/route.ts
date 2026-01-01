import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = registerSchema.parse(body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: { 
        username, 
        email, 
        password: hashedPassword,
        role: 'USER',
        balance: 0
      },
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}