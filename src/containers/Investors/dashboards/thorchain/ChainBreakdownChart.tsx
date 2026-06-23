import { useQuery } from '@tanstack/react-query'
import { lazy, useMemo, useState } from 'react'
import type { IMultiSeriesChartProps } from '~/components/ECharts/types'
import ProtocolChartBuilderData from '~/containers/ProDashboard/services/ProtocolChartBuilderData'
import ProtocolCharts from '~/containers/ProDashboard/services/ProtocolCharts'
import { getGroupedTimestampSec } from '~/containers/ProDashboard/utils'
import { ChartCard, PALETTE, SegToggle, THOR_TEAL } from './ui'

const MultiSeriesChart = lazy(() => import('~/components/ECharts/MultiSeriesChart')) as React.FC<IMultiSeriesChartProps>

const DEX = 'thorchain-dex'
const GOLD = '#f5c842'

// All from DefiLlama internal APIs (context-free services, no ir-server hop).
type Metric =
	| 'fees'
	| 'revenue'
	| 'volume'
	| 'user-fees'
	| 'holders-revenue'
	| 'protocol-revenue'
	| 'supply-side-revenue'
type View = 'day' | 'month' | 'quarter' | 'cumulative'
type Pts = Array<[number, number]>

const VIEWS: { value: View; label: string }[] = [
	{ value: 'day', label: 'Daily' },
	{ value: 'month', label: 'Monthly' },
	{ value: 'quarter', label: 'Quarterly' },
	{ value: 'cumulative', label: 'Cumulative' }
]

interface RawSeries {
	name: string
	data: Pts
	color?: string
}

// Scrolling top legend + cleared grid top, so many-series legends never overlap the y-axis.
const CHART_OPTIONS = { legend: { type: 'scroll', top: 0 }, grid: { top: 40 } } as any
const QUERY_OPTS = { staleTime: 10 * 60 * 1000, refetchOnWindowFocus: false } as const

function aggregate(series: RawSeries[], view: View, stacked: boolean) {
	if (!series.length) return []
	const grouping = view === 'cumulative' ? 'day' : view
	let agg = series.map((s, i) => {
		const acc = new Map<number, number>()
		for (const [ts, val] of s.data) {
			const key = grouping === 'day' ? ts : getGroupedTimestampSec(ts, grouping)
			acc.set(key, (acc.get(key) ?? 0) + (Number.isFinite(val) ? val : 0))
		}
		return {
			name: s.name,
			color: s.color || PALETTE[i % PALETTE.length],
			points: [...acc.entries()].sort((a, b) => a[0] - b[0])
		}
	})
	if (view === 'cumulative') {
		agg = agg.map((s) => {
			let run = 0
			return { ...s, points: s.points.map(([t, v]) => [t, (run += v)] as [number, number]) }
		})
	}
	const useArea = stacked || agg.length === 1
	return agg.map((s) => ({
		name: s.name,
		data: s.points,
		color: s.color,
		type: (view === 'cumulative' ? 'line' : 'bar') as 'line' | 'bar',
		...(stacked ? { stack: 'total' } : {}),
		...(view === 'cumulative' && useArea ? { areaStyle: {} } : {})
	}))
}

function TrendCard({
	title,
	subtitle,
	valueSymbol,
	view,
	setView,
	chartSeries,
	isLoading,
	isError
}: {
	title: string
	subtitle?: string
	valueSymbol: string
	view: View
	setView: (v: View) => void
	chartSeries: any[]
	isLoading: boolean
	isError?: boolean
}) {
	const groupBy = view === 'month' ? 'monthly' : view === 'quarter' ? 'quarterly' : 'daily'
	return (
		<ChartCard
			title={title}
			subtitle={subtitle}
			control={<SegToggle options={VIEWS} value={view} onChange={setView} />}
		>
			{isLoading ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">Loading…</div>
			) : isError ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">
					Failed to load data
				</div>
			) : !chartSeries.length ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">No data</div>
			) : (
				<MultiSeriesChart
					series={chartSeries}
					valueSymbol={valueSymbol}
					groupBy={groupBy}
					height="360px"
					chartOptions={CHART_OPTIONS}
				/>
			)}
		</ChartCard>
	)
}

// Single metric, broken down by chain (stacked). Used for the by-chain detail on Financials.
export function ChainBreakdownChart({
	metric,
	title,
	subtitle,
	protocol = DEX,
	valueSymbol = '$',
	limit = 12
}: {
	metric: Metric
	title: string
	subtitle?: string
	protocol?: string
	valueSymbol?: string
	limit?: number
}) {
	const [view, setView] = useState<View>('day')
	const { data, isLoading, isError } = useQuery({
		queryKey: ['thorchain-breakdown', protocol, metric, limit],
		queryFn: () => ProtocolChartBuilderData.getProtocolChainData(protocol, metric, undefined, limit),
		...QUERY_OPTS
	})
	const series = useMemo(() => (data?.series ?? []) as RawSeries[], [data])
	const chartSeries = useMemo(() => aggregate(series, view, true), [series, view])
	return (
		<TrendCard
			title={title}
			subtitle={subtitle}
			valueSymbol={valueSymbol}
			view={view}
			setView={setView}
			chartSeries={chartSeries}
			isLoading={isLoading}
			isError={isError}
		/>
	)
}

// Fees + Revenue merged (two overlaid totals), both from the protocol fees adapter so the
// chain figures match defillama.com/chain/thorchain. `chain` → native `thorchain` protocol
// (NOT the chain-wide aggregate, which folds in unaffiliated apps like THORWallet); `dex` → thorchain-dex.
function totalFn(source: 'chain' | 'dex', metric: 'fees' | 'revenue'): () => Promise<Pts> {
	const protocol = source === 'chain' ? 'thorchain' : DEX
	return metric === 'fees' ? () => ProtocolCharts.fees(protocol) : () => ProtocolCharts.revenue(protocol)
}

export function FeeRevenueChart({
	source,
	title,
	subtitle,
	defaultView = 'cumulative'
}: {
	source: 'chain' | 'dex'
	title: string
	subtitle?: string
	defaultView?: View
}) {
	const [view, setView] = useState<View>(defaultView)
	const fees = useQuery({
		queryKey: ['thorchain-total', source, 'fees'],
		queryFn: totalFn(source, 'fees'),
		...QUERY_OPTS
	})
	const revenue = useQuery({
		queryKey: ['thorchain-total', source, 'revenue'],
		queryFn: totalFn(source, 'revenue'),
		...QUERY_OPTS
	})
	const rawSeries = useMemo(
		() =>
			[
				fees.data?.length ? { name: 'Fees', data: fees.data, color: THOR_TEAL } : null,
				revenue.data?.length ? { name: 'Revenue', data: revenue.data, color: GOLD } : null
			].filter(Boolean) as RawSeries[],
		[fees.data, revenue.data]
	)
	const chartSeries = useMemo(() => aggregate(rawSeries, view, false), [rawSeries, view])
	return (
		<TrendCard
			title={title}
			subtitle={subtitle}
			valueSymbol="$"
			view={view}
			setView={setView}
			chartSeries={chartSeries}
			isLoading={fees.isLoading || revenue.isLoading}
			isError={fees.isError || revenue.isError}
		/>
	)
}

// Single flow metric (e.g. volume) as a total, with the daily/cumulative toggle.
export function MetricTrendChart({
	title,
	subtitle,
	name,
	queryKey,
	queryFn,
	valueSymbol = '$',
	defaultView = 'cumulative',
	color = THOR_TEAL
}: {
	title: string
	subtitle?: string
	name: string
	queryKey: unknown[]
	queryFn: () => Promise<Pts>
	valueSymbol?: string
	defaultView?: View
	color?: string
}) {
	const [view, setView] = useState<View>(defaultView)
	const { data, isLoading, isError } = useQuery({ queryKey, queryFn, ...QUERY_OPTS })
	const rawSeries = useMemo(() => (data?.length ? [{ name, data, color }] : []), [data, name, color])
	const chartSeries = useMemo(() => aggregate(rawSeries, view, false), [rawSeries, view])
	return (
		<TrendCard
			title={title}
			subtitle={subtitle}
			valueSymbol={valueSymbol}
			view={view}
			setView={setView}
			chartSeries={chartSeries}
			isLoading={isLoading}
			isError={isError}
		/>
	)
}

// Single stock metric (TVL, price) as an area line with a dataZoom scroll slider.
// `value` shows a headline figure inline (like the TVL number); `zoomDays` default-zooms
// to the last N days (older history still reachable by scrolling the slider).
export function SeriesAreaChart({
	title,
	subtitle,
	name,
	queryKey,
	queryFn,
	valueSymbol = '$',
	color = THOR_TEAL,
	value,
	zoomDays
}: {
	title: string
	subtitle?: string
	name: string
	queryKey: unknown[]
	queryFn: () => Promise<Pts>
	valueSymbol?: string
	color?: string
	value?: string
	zoomDays?: number
}) {
	const { data, isLoading, isError } = useQuery({ queryKey, queryFn, ...QUERY_OPTS })
	const series = useMemo(
		() => (data?.length ? [{ name, data, color, type: 'line' as const, areaStyle: {} }] : []),
		[data, name, color]
	)
	const opts = useMemo(() => {
		if (!zoomDays || !data || data.length <= zoomDays) return CHART_OPTIONS
		const start = ((data.length - zoomDays) / data.length) * 100
		return {
			...CHART_OPTIONS,
			dataZoom: [
				{ start, end: 100 },
				{ start, end: 100 }
			]
		}
	}, [zoomDays, data])
	return (
		<ChartCard title={title} subtitle={subtitle} value={value}>
			{isLoading ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">Loading…</div>
			) : isError ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">
					Failed to load data
				</div>
			) : !series.length ? (
				<div className="flex h-[360px] items-center justify-center text-xs text-(--text-tertiary)">No data</div>
			) : (
				<MultiSeriesChart
					series={series}
					valueSymbol={valueSymbol}
					groupBy="daily"
					height="360px"
					chartOptions={opts}
				/>
			)}
		</ChartCard>
	)
}
