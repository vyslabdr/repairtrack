'use client'

import React, { FC, useMemo } from 'react'
import { useRealtimeRepairData, RepairDataPoint } from '@/hooks/useRealtimeRepairData'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Euro, TrendingUp, Clock, BarChart2, Wrench } from 'lucide-react'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

interface MetricCardProps {
  title: string
  value: number
  icon?: React.ReactNode
  description?: string
  valueClassName?: string
  isCurrency?: boolean
}

const MetricCard: FC<MetricCardProps> = ({ title, value, icon, description, valueClassName, isCurrency }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClassName ?? ''}`}>
        {isCurrency
          ? formatCurrency(value)
          : value.toLocaleString('el-GR')}
      </div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
)

interface RealtimeChartProps {
  data: RepairDataPoint[]
  title: string
  dataKey: keyof RepairDataPoint
  lineColor: string
  tooltipFormatter?: (value: number) => string
  legendName: string
}

const RealtimeChart: FC<RealtimeChartProps> = React.memo(
  ({ data, title, dataKey, lineColor, tooltipFormatter, legendName }) => {
    const chartData = useMemo(() => {
      if (!data.length) return []
      const now = new Date()
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)

      const filtered = data.filter(point => {
        if (!point.time) return false
        const parts = point.time.split(':')
        if (parts.length !== 3) return true
        const t = new Date()
        t.setHours(+parts[0], +parts[1], +parts[2])
        return t >= twoMinutesAgo
      })

      return filtered.length > 0 ? filtered : data.slice(-10)
    }, [data])

    const chartKey = useMemo(() => `chart-${title}-${String(dataKey)}`, [title, dataKey])

    return (
      <Card className="flex-1 min-w-[300px] max-w-full lg:max-w-[calc(50%-8px)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                key={chartKey}
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" strokeOpacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  fontSize={10}
                  interval="preserveStartEnd"
                  tickFormatter={(tick: string) => {
                    if (tick.includes(':')) {
                      const parts = tick.split(':')
                      return parts.length >= 3 ? `${parts[1]}:${parts[2]}` : tick
                    }
                    return tick
                  }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={tooltipFormatter ?? ((v) => String(v))}
                  width={60}
                />
                <RechartsTooltip
                  cursor={{ stroke: lineColor, strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#1A1D27',
                    borderColor: '#2E3347',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#F1F5F9' }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(value: unknown) => {
                    const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0
                    return [tooltipFormatter ? tooltipFormatter(num) : num, legendName]
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#94A3B8', paddingTop: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={false}
                  name={legendName}
                  connectNulls={false}
                  isAnimationActive={chartData.length <= 1}
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  }
)

RealtimeChart.displayName = 'RealtimeChart'

export const SalesDashboard: FC = () => {
  const {
    totalRevenue,
    salesCount,
    averageSale,
    salesChartData,
    cumulativeRevenueData,
    latestPayments,
  } = useRealtimeRepairData()

  return (
    <div className="w-full text-foreground flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            Ζωντανή Παρακολούθηση
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Πραγματικός χρόνος εισπράξεων & επισκευών
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Συνολικά Έσοδα"
          value={totalRevenue}
          icon={<Euro className="h-4 w-4 text-muted-foreground" />}
          description="Σωρευτικά έσοδα επισκευών"
          valueClassName="text-emerald-400"
          isCurrency
        />
        <MetricCard
          title="Επισκευές"
          value={salesCount}
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          description="Ολοκληρωμένες επισκευές"
        />
        <MetricCard
          title="Μέσο Κόστος"
          value={averageSale}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Μέση αξία ανά επισκευή"
          valueClassName="text-blue-400"
          isCurrency
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Κατάσταση</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              Live
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ροή δεδομένων σε εξέλιξη</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="flex flex-wrap gap-4">
        <RealtimeChart
          data={salesChartData}
          title="Εισπράξεις / δευτερόλεπτο"
          dataKey="sales"
          lineColor="#6366F1"
          tooltipFormatter={formatCurrency}
          legendName="Ποσό Επισκευής"
        />
        <RealtimeChart
          data={cumulativeRevenueData}
          title="Σωρευτικά Έσοδα"
          dataKey="sales"
          lineColor="#22C55E"
          tooltipFormatter={formatCurrency}
          legendName="Σωρευτικά Έσοδα"
        />
      </div>

      {/* Latest Repairs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Wrench className="h-4 w-4 text-primary" />
            Πρόσφατες Επισκευές
          </CardTitle>
          <CardDescription>Τελευταίες ολοκληρωμένες επισκευές, ζωντανή ενημέρωση.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[260px]">
            <div className="divide-y divide-border">
              {latestPayments.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Δεν υπάρχουν ακόμα επισκευές...
                </p>
              ) : (
                latestPayments.map((repair) => (
                  <div
                    key={repair.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(repair.amount)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {repair.product}
                      </p>
                      <p className="text-xs text-muted-foreground/70">{repair.customer}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {repair.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-3 text-xs text-muted-foreground">
          Εμφανίζονται οι 10 πιο πρόσφατες επισκευές.
        </CardFooter>
      </Card>
    </div>
  )
}
