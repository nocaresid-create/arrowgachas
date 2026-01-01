import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// PENTING: Endpoint ini hanya boleh dipanggil SEKALI saat setup awal!
// Setelah selesai, HAPUS file ini atau tambahkan authentication!

export async function GET() {
  try {
    console.log('🌱 Starting database seed...')

    // Check if already seeded
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: '⚠️ Database already seeded! Admin user exists.',
        warning: 'If you want to re-seed, delete all data first from MongoDB Atlas',
      })
    }

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10)
    const userPassword = await bcrypt.hash('user123', 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@spinwheel.com',
        password: adminPassword,
        role: 'ADMIN',
        balance: 0,
      },
    })

    // Create test user with balance
    const user = await prisma.user.create({
      data: {
        username: 'user1',
        email: 'user1@test.com',
        password: userPassword,
        role: 'USER',
        balance: 1000000, // 1M IDR for testing
      },
    })

    // Create rarities
    const uncommon = await prisma.rarity.create({
      data: { name: 'uncommon', color: '#4CAF50', dropRate: 50, order: 1 },
    })

    const rare = await prisma.rarity.create({
      data: { name: 'rare', color: '#2196F3', dropRate: 30, order: 2 },
    })

    const epic = await prisma.rarity.create({
      data: { name: 'epic', color: '#9C27B0', dropRate: 15, order: 3 },
    })

    const legendary = await prisma.rarity.create({
      data: { name: 'legendary', color: '#FFC107', dropRate: 4, order: 4 },
    })

    const mythic = await prisma.rarity.create({
      data: { name: 'mythic', color: '#F44336', dropRate: 1, order: 5 },
    })

    // Create items
    const itemsData = [
      { name: 'Health Potion', rarityId: uncommon.id, image: '🧪' },
      { name: 'Wooden Shield', rarityId: uncommon.id, image: '🛡️' },
      { name: 'Iron Sword', rarityId: uncommon.id, image: '⚔️' },
      { name: 'Leather Boots', rarityId: uncommon.id, image: '👢' },
      
      { name: 'Silver Coin', rarityId: rare.id, image: '🪙' },
      { name: 'Steel Armor', rarityId: rare.id, image: '🦾' },
      { name: 'Magic Scroll', rarityId: rare.id, image: '📜' },
      { name: 'Battle Axe', rarityId: rare.id, image: '🪓' },
      
      { name: 'Crystal Ball', rarityId: epic.id, image: '🔮' },
      { name: 'Magic Staff', rarityId: epic.id, image: '🪄' },
      { name: 'Enchanted Bow', rarityId: epic.id, image: '🏹' },
      { name: 'Ruby Gem', rarityId: epic.id, image: '💎' },
      
      { name: 'Golden Crown', rarityId: legendary.id, image: '👑' },
      { name: 'Diamond Ring', rarityId: legendary.id, image: '💍' },
      { name: 'Ancient Tome', rarityId: legendary.id, image: '📕' },
      
      { name: 'Dragon Sword', rarityId: mythic.id, image: '🗡️' },
      { name: 'Phoenix Feather', rarityId: mythic.id, image: '🪶' },
      { name: 'Infinity Stone', rarityId: mythic.id, image: '💠' },
    ]

    const items = await Promise.all(
      itemsData.map((item) => prisma.item.create({ data: item }))
    )

    // Create config
    await prisma.config.create({
      data: { key: 'spin_price', value: '50000' },
    })

    await prisma.config.create({
      data: { key: 'gacha_price', value: '30000' },
    })

    return NextResponse.json({
      success: true,
      message: '🎉 Database seeded successfully!',
      data: {
        users: [
          { username: admin.username, role: admin.role },
          { username: user.username, role: user.role, balance: user.balance },
        ],
        rarities: 5,
        items: items.length,
        configs: 2,
      },
      credentials: {
        admin: { username: 'admin', password: 'admin123' },
        user: { username: 'user1', password: 'user123' },
      },
      warning: '⚠️ IMPORTANT: Delete this API route (/app/api/seed/route.ts) after seeding for security!',
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        error: 'Seed failed',
        message: error.message,
        details: 'Check Vercel logs for more information',
      },
      { status: 500 }
    )
  }
}