'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface RepairDataPoint {
  time: string
  sales: number
}

export interface LatestRepair {
  id: string
  amount: number
  product: string
  customer: string
  time: string
}

const DEVICE_TYPES = [
  'iPhone 14 Pro', 'Samsung S23', 'Xiaomi 13', 'iPad Pro',
  'MacBook Air', 'Huawei P50', 'OnePlus 11', 'Sony Xperia 5',
  'Laptop HP', 'Dell XPS 13', 'Asus ZenBook', 'Nokia G21',
]

const CUSTOMERS = [
  'Γ. Παπαδόπουλος', 'Μ. Κωνσταντίνου', 'Α. Νικολάου', 'Ε. Δημητρίου',
  'Χ. Αλεξίου', 'Σ. Γεωργίου', 'Π. Ιωάννου', 'Δ. Αντωνίου',
  'Κ. Θεοδώρου', 'Ν. Χριστοδούλου', 'Β. Μιχαήλ', 'Τ. Λάζαρου',
]

const REPAIR_TYPES = [
  'Αντικατάσταση Οθόνης', 'Επισκευή Μπαταρίας', 'Επισκευή Κάμερας',
  'Αντικατάσταση Πλακέτας', 'Καθαρισμός & Συντήρηση', 'Επισκευή Φόρτισης',
  'Αντικατάσταση Κουμπιών', 'Επισκευή Μικρόφωνου', 'Ανάκτηση Δεδομένων',
]

function getTimeString(): string {
  const now = new Date()
  return now.toTimeString().split(' ')[0]
}

function randomAmount(): number {
  return Math.round((Math.random() * 180 + 20) * 100) / 100
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function useRealtimeRepairData() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [salesCount, setSalesCount] = useState(0)
  const [averageSale, setAverageSale] = useState(0)
  const [salesChartData, setSalesChartData] = useState<RepairDataPoint[]>([])
  const [cumulativeRevenueData, setCumulativeRevenueData] = useState<RepairDataPoint[]>([])
  const [latestPayments, setLatestPayments] = useState<LatestRepair[]>([])

  const cumulativeRef = useRef(0)
  const countRef = useRef(0)

  const addDataPoint = useCallback(() => {
    const amount = randomAmount()
    const time = getTimeString()

    cumulativeRef.current += amount
    countRef.current += 1

    const cumulative = Math.round(cumulativeRef.current * 100) / 100
    const count = countRef.current
    const avg = Math.round((cumulative / count) * 100) / 100

    setTotalRevenue(cumulative)
    setSalesCount(count)
    setAverageSale(avg)

    setSalesChartData(prev => {
      const next = [...prev, { time, sales: amount }]
      return next.slice(-60)
    })

    setCumulativeRevenueData(prev => {
      const next = [...prev, { time, sales: cumulative }]
      return next.slice(-60)
    })

    const newRepair: LatestRepair = {
      id: `repair-${Date.now()}-${Math.random()}`,
      amount,
      product: `${randomFrom(DEVICE_TYPES)} — ${randomFrom(REPAIR_TYPES)}`,
      customer: randomFrom(CUSTOMERS),
      time,
    }

    setLatestPayments(prev => [newRepair, ...prev].slice(0, 10))
  }, [])

  useEffect(() => {
    // Initial burst of data
    for (let i = 0; i < 10; i++) {
      setTimeout(() => addDataPoint(), i * 120)
    }

    // Then stream every 1.5s
    const interval = setInterval(addDataPoint, 1500)
    return () => clearInterval(interval)
  }, [addDataPoint])

  return {
    totalRevenue,
    salesCount,
    averageSale,
    salesChartData,
    cumulativeRevenueData,
    latestPayments,
  }
}
