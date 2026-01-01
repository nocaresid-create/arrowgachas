'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState(0)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchInventory()
  }, [])

  const fetchUserData = async () => {
    // In real app, fetch from /api/user/profile
    setBalance(1000000) // Demo
    setLoading(false)
  }

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/user/inventory')
      const data = await res.json()
      setInventory(data.inventory || [])
    } catch (error) {
      console.error('Failed to fetch inventory')
    }
  }

  const handleLogout = async () => {
    document.cookie = 'auth-token=; Max-Age=0; path=/'
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 bg-opacity-80 backdrop-blur border-b border-purple-500 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🎰 SpinWheel & Gacha</h1>
            <p className="text-sm text-gray-400">User Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-xl font-bold text-green-400">
                Rp {balance.toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/spin')}
            className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl hover:scale-105 transition-transform text-white"
          >
            <div className="text-4xl mb-2">🎡</div>
            <h3 className="text-xl font-bold mb-1">Spin Wheel</h3>
            <p className="text-sm opacity-90">Rp 50,000</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/gacha')}
            className="bg-gradient-to-br from-pink-600 to-pink-800 p-6 rounded-xl hover:scale-105 transition-transform text-white"
          >
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-xl font-bold mb-1">Gacha Roll</h3>
            <p className="text-sm opacity-90">Rp 30,000</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/payment')}
            className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl hover:scale-105 transition-transform text-white"
          >
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-xl font-bold mb-1">Top Up</h3>
            <p className="text-sm opacity-90">Add Balance</p>
          </button>
        </div>

        {/* Inventory */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">📦 My Inventory</h2>
          
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🎒</div>
              <p>Your inventory is empty</p>
              <p className="text-sm">Start spinning to collect items!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {inventory.map((inv: any) => (
                <div
                  key={inv.id}
                  className="bg-gray-700 rounded-lg p-4 border-2 transition-transform hover:scale-105"
                  style={{ borderColor: inv.item.rarity.color }}
                >
                  <div className="text-4xl text-center mb-2">{inv.item.image}</div>
                  <p className="text-sm text-white font-medium text-center truncate">
                    {inv.item.name}
                  </p>
                  <p
                    className="text-xs text-center capitalize mt-1"
                    style={{ color: inv.item.rarity.color }}
                  >
                    {inv.item.rarity.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}