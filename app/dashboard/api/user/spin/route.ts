import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const spinConfig = await prisma.config.findUnique({
      where: { key: 'spin_price' },
    })
    const spinPrice = parseInt(spinConfig?.value || '50000')

    if (user.balance < spinPrice) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    const rarities = await prisma.rarity.findMany({
      orderBy: { order: 'asc' },
    })

    const totalRate = rarities.reduce((sum, r) => sum + r.dropRate, 0)
    let random = Math.random() * totalRate
    let selectedRarity = rarities[0]

    for (const rarity of rarities) {
      random -= rarity.dropRate
      if (random <= 0) {
        selectedRarity = rarity
        break
      }
    }

    const items = await prisma.item.findMany({
      where: { rarityId: selectedRarity.id },
    })

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items available for this rarity' },
        { status: 400 }
      )
    }

    const selectedItem = items[Math.floor(Math.random() * items.length)]

    // MongoDB doesn't support transactions like PostgreSQL
    // So we do operations sequentially
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: user.balance - spinPrice },
    })

    await prisma.inventory.create({
      data: { userId: user.id, itemId: selectedItem.id },
    })

    await prisma.spinHistory.create({
      data: { userId: user.id, itemId: selectedItem.id },
    })

    const itemWithRarity = await prisma.item.findUnique({
      where: { id: selectedItem.id },
      include: { rarity: true },
    })

    return NextResponse.json({
      success: true,
      item: itemWithRarity,
      newBalance: user.balance - spinPrice,
    })
  } catch (error) {
    console.error('Spin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}