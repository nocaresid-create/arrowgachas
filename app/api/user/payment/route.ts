import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, proofImage } = body

    const payment = await prisma.payment.create({
      data: {
        userId: userData.userId,
        amount: parseInt(amount),
        type,
        proofImage,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await prisma.payment.findMany({
      where: { userId: userData.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}