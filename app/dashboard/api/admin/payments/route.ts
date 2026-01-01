import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Get all payments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, status } = body

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    })

    if (status === 'VERIFIED') {
      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          balance: {
            increment: payment.amount,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
    })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}