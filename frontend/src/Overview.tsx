import { useMemo, useState } from 'react'
import './Overview.css'

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const

type RangeKey = (typeof RANGE_OPTIONS)[number]['value']

interface RevenueRow {
  label: string
  value: number
}

interface MixSegment {
  label: string
  value: number
  color: string
}

interface OverviewProps {
  onNavigate?: (target: string) => void
  currentUser?: {
    name?: string
  } | null
}

const TREND_DATA: Record<RangeKey, number[]> = {
  '7d': [28, 36, 30, 44, 40, 52, 48],
  '30d': [26, 30, 28, 34, 38, 36, 40, 44, 42, 48],
  '90d': [22, 26, 24, 28, 32, 30, 36, 40, 38, 44, 46, 50],
}

const REVENUE_DATA: Record<RangeKey, RevenueRow[]> = {
  '7d': [
    { label: 'Labor', value: 420 },
    { label: 'Parts', value: 310 },
    { label: 'Detailing', value: 260 },
    { label: 'Paint', value: 190 },
    { label: 'Other', value: 120 },
  ],
  '30d': [
    { label: 'Labor', value: 1680 },
    { label: 'Parts', value: 1240 },
    { label: 'Detailing', value: 980 },
    { label: 'Paint', value: 860 },
    { label: 'Other', value: 520 },
  ],
  '90d': [
    { label: 'Labor', value: 4280 },
    { label: 'Parts', value: 3520 },
    { label: 'Detailing', value: 2710 },
    { label: 'Paint', value: 1980 },
    { label: 'Other', value: 1210 },
  ],
}

const MIX_DATA: Record<RangeKey, MixSegment[]> = {
  '7d': [
    { label: 'Inspection', value: 28, color: '#ff8a65' },
    { label: 'Service', value: 34, color: '#f6c453' },
    { label: 'Delivery QC', value: 18, color: '#4dd0e1' },
    { label: 'Invoicing', value: 20, color: '#7e8ef1' },
  ],
  '30d': [
    { label: 'Inspection', value: 24, color: '#ff8a65' },
    { label: 'Service', value: 36, color: '#f6c453' },
    { label: 'Delivery QC', value: 16, color: '#4dd0e1' },
    { label: 'Invoicing', value: 24, color: '#7e8ef1' },
  ],
  '90d': [
    { label: 'Inspection', value: 22, color: '#ff8a65' },
    { label: 'Service', value: 38, color: '#f6c453' },
    { label: 'Delivery QC', value: 18, color: '#4dd0e1' },
    { label: 'Invoicing', value: 22, color: '#7e8ef1' },
  ],
}

const QUICK_ACTIONS = [
  { label: 'New Job Order', description: 'Capture fresh service requests fast.', target: 'Job Order Management' },
  { label: 'Create Invoice', description: 'Send a polished payment request.', target: 'Payment & Invoice' },
  { label: 'Start Inspection', description: 'Assign the next inspection bay.', target: 'Inspection' },
  { label: 'Prepare Exit Permit', description: 'Finalize ready-to-go vehicles.', target: 'Exit Permit' },
  { label: 'Add Customer', description: 'Create a new customer profile.', target: 'Customers Management' },
  { label: 'Service Execution', description: 'Move approved work into action.', target: 'Service Execution' },
]

const PRIORITY_LIST = [
  { title: '5 vehicles awaiting inspection', detail: 'Next in line: RX-3512', status: 'Urgent' },
  { title: '12 invoices pending approval', detail: 'Finance review needed today', status: 'Review' },
  { title: '3 service approvals expiring', detail: 'Approve before 4 PM', status: 'Attention' },
  { title: '2 delivery QC misses', detail: 'Re-check vehicle detailing', status: 'Flag' },
]

const ACTIVITY_LIST = [
  { title: 'Job order #9841 approved', time: '20 mins ago', owner: 'Leila A.' },
  { title: 'Customer follow-up sent', time: '45 mins ago', owner: 'Omar K.' },
  { title: 'Inspection bay 2 cleared', time: '1 hr ago', owner: 'Team Lead' },
  { title: 'Invoice #7721 paid', time: '2 hrs ago', owner: 'Finance' },
]

const formatCurrency = (value: number): string => `$${value.toLocaleString('en-US')}`

const buildConicGradient = (segments: MixSegment[]): string => {
  const total = segments.reduce((sum: number, item: MixSegment) => sum + item.value, 0)
  let start = 0
  const parts = segments.map((item: MixSegment) => {
    const span = (item.value / total) * 360
    const segment = `${item.color} ${start}deg ${start + span}deg`
    start += span
    return segment
  })
  return `conic-gradient(${parts.join(', ')})`
}

const buildSparklinePoints = (values: number[], width: number, height: number): string => {
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  return values
    .map((value: number, index: number) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - minValue) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function Overview({ onNavigate, currentUser }: OverviewProps) {
  const [trendRange, setTrendRange] = useState<RangeKey>('30d')
  const [revenueRange, setRevenueRange] = useState<RangeKey>('30d')
  const [mixRange, setMixRange] = useState<RangeKey>('30d')

  const trendPoints = useMemo(() => buildSparklinePoints(TREND_DATA[trendRange], 280, 80), [trendRange])
  const revenueRows = REVENUE_DATA[revenueRange]
  const mixSegments = MIX_DATA[mixRange]
  const pieStyle = useMemo(() => ({ background: buildConicGradient(mixSegments) }), [mixSegments])

  const totalRevenue = revenueRows.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="overview-root">
      <header className="overview-hero">
        <div>
          <p className="overview-kicker">Welcome back, {currentUser?.name || 'team'}</p>
          <h2>Overview Dashboard</h2>
          <p className="overview-subtitle">A live pulse of operations, approvals, and revenue health.</p>
        </div>
        <div className="overview-hero-card">
          <div>
            <span>Active job orders</span>
            <strong>128</strong>
          </div>
          <div>
            <span>On-time delivery</span>
            <strong>94%</strong>
          </div>
          <div>
            <span>Open approvals</span>
            <strong>19</strong>
          </div>
        </div>
      </header>

      <div className="overview-grid">
        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Job Order Momentum</h3>
              <p>Daily intake trend with completion velocity.</p>
            </div>
            <select value={trendRange} onChange={(event) => setTrendRange(event.target.value as RangeKey)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="sparkline">
            <svg viewBox="0 0 280 80" role="img" aria-label="Job order trend">
              <polyline points={trendPoints} />
            </svg>
            <div className="sparkline-metrics">
              <div>
                <span>Peak day</span>
                <strong>52 orders</strong>
              </div>
              <div>
                <span>Avg duration</span>
                <strong>3.2 days</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Revenue Mix</h3>
              <p>Share of revenue by workflow stage.</p>
            </div>
            <select value={mixRange} onChange={(event) => setMixRange(event.target.value as RangeKey)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="pie-layout">
            <div className="pie" style={pieStyle} />
            <ul className="pie-legend">
              {mixSegments.map((segment) => (
                <li key={segment.label}>
                  <span style={{ background: segment.color }} />
                  <div>
                    <strong>{segment.label}</strong>
                    <p>{segment.value}%</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Revenue by Department</h3>
              <p>Top earning areas this period.</p>
            </div>
            <select value={revenueRange} onChange={(event) => setRevenueRange(event.target.value as RangeKey)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="bar-chart">
            <div className="bar-total">
              <span>Total</span>
              <strong>{formatCurrency(totalRevenue)}</strong>
            </div>
            <div className="bar-list">
              {revenueRows.map((row) => (
                <div key={row.label} className="bar-row">
                  <div>
                    <span>{row.label}</span>
                    <strong>{formatCurrency(row.value)}</strong>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${Math.round((row.value / totalRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="overview-secondary">
        <section className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Quick Actions</h3>
              <p>Jump straight to high impact tasks.</p>
            </div>
          </div>
          <div className="quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="quick-action"
                onClick={() => onNavigate?.(action.target)}
              >
                <h4>{action.label}</h4>
                <p>{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Priority List</h3>
              <p>Keep urgent tasks visible to the team.</p>
            </div>
          </div>
          <ul className="stacked-list">
            {PRIORITY_LIST.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span className="pill">{item.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="overview-card">
          <div className="overview-card-header">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest team movements in real-time.</p>
            </div>
          </div>
          <ul className="stacked-list subtle">
            {ACTIVITY_LIST.map((item) => (
              <li key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.owner}</p>
                </div>
                <span className="timestamp">{item.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}

export default Overview
