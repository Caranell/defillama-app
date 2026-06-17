import { useQuery } from '@tanstack/react-query'
import { lazy, useEffect, useMemo } from 'react'
import type { IBarChartProps } from '~/components/ECharts/types'
import { useContentReady } from '~/containers/Investors/ContentReadyContext'
import { FLARE_BLUE, FLARE_GREEN, lastNDaysZoom } from './chartDefaults'
import { chartToData, type UpstreamChart } from './transform'
import { ChartCard, KpiCard, SectionHeader } from './ui'

const BarChart = lazy(() => import('~/components/ECharts/BarChart')) as React.FC<IBarChartProps>

interface FormattedValue {
	value: number
	formatted: string
}

interface NetworkAPIResponse {
	transactionsChart: UpstreamChart
	activeAccountsChart: UpstreamChart
	kpis: {
		totalTransactions: FormattedValue
		transactions24h: FormattedValue
		avgDailyTxs7d: FormattedValue
		avgDailyTxs30d: FormattedValue
		totalAddresses: FormattedValue
	}
}

function buildChart(c: UpstreamChart, fallbackName: string) {
	return { data: chartToData(c), title: c.title, seriesName: c.series[0]?.name ?? fallbackName }
}

export default function Network() {
	const query = useQuery<NetworkAPIResponse>({
		queryKey: ['flare-network'],
		queryFn: async () => {
			const res = await fetch('/api/public/flare/network')
			if (!res.ok) throw new Error(`Flare network API error: ${res.status}`)
			return res.json()
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false
	})

	const onContentReady = useContentReady()

	useEffect(() => {
		if (query.data) onContentReady()
	}, [query.data, onContentReady])

	const charts = useMemo(() => {
		if (!query.data) return null
		const d = query.data
		return {
			transactions: buildChart(d.transactionsChart, 'Transactions'),
			activeAccounts: buildChart(d.activeAccountsChart, 'Active Accounts')
		}
	}, [query.data])

	if (!query.data || !charts) return null

	const k = query.data.kpis
	const c = charts

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader>Network Stats</SectionHeader>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				<KpiCard label="Total Txns" value={k.totalTransactions.formatted} />
				<KpiCard label="24h Txns" value={k.transactions24h.formatted} />
				<KpiCard label="Avg Daily 7d" value={k.avgDailyTxs7d.formatted} />
				<KpiCard label="Avg Daily 30d" value={k.avgDailyTxs30d.formatted} />
				<KpiCard label="Total Addresses" value={k.totalAddresses.formatted} />
			</div>

			{c.transactions.data.length > 0 && (
				<ChartCard
					title={c.transactions.title ?? 'Daily Transactions'}
					subtitle="Transactions settled on Flare each day."
				>
					<BarChart
						chartData={c.transactions.data}
						stacks={{ [c.transactions.seriesName]: 'a' }}
						stackColors={{ [c.transactions.seriesName]: FLARE_BLUE }}
						title=""
						height="320px"
						chartOptions={lastNDaysZoom(c.transactions.data.length)}
					/>
				</ChartCard>
			)}

			{c.activeAccounts.data.length > 0 && (
				<ChartCard
					title={c.activeAccounts.title ?? 'Daily Active Accounts'}
					subtitle="Unique accounts active on Flare each day."
				>
					<BarChart
						chartData={c.activeAccounts.data}
						stacks={{ [c.activeAccounts.seriesName]: 'a' }}
						stackColors={{ [c.activeAccounts.seriesName]: FLARE_GREEN }}
						title=""
						height="320px"
						chartOptions={lastNDaysZoom(c.activeAccounts.data.length)}
					/>
				</ChartCard>
			)}
		</div>
	)
}
