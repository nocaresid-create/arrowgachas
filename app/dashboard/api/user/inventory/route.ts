import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inventory = await prisma.inventory.findMany({
      where: { userId: userData.userId },
      include: {
        item: {
          include: {
            rarity: true,
          },
        },
      },
      orderBy: { obtainedAt: 'desc' },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}