import { useQuery } from '@tanstack/react-query'
import { lazy, useEffect, useMemo } from 'react'
import type { IChartProps, IPieChartProps } from '~/components/ECharts/types'
import { useContentReady } from '~/containers/Investors/ContentReadyContext'
import { FLARE_BLUE, FLARE_GREEN, FLARE_ORANGE, FLARE_PINK, lastNDaysZoom } from './chartDefaults'
import { chartToData, type UpstreamChart } from './transform'
import { ChartCard, KpiCard, NarrativeCallout, SectionHeader } from './ui'

const AreaChart = lazy(() => import('~/components/ECharts/AreaChart')) as React.FC<IChartProps>
const PieChart = lazy(() => import('~/components/ECharts/PieChart')) as React.FC<IPieChartProps>

interface FormattedValue {
	value: number
	formatted: string
}

interface DistributionChart {
	title?: string
	labels: string[]
	series: { name: string; data: number[] }[]
}

interface FAssetsAPIResponse {
	narrative?: string
	lockedOverTimeChart?: UpstreamChart
	distributionChart?: DistributionChart
	kpis: {
		totalFxrpSupply: FormattedValue
		pctLockedInDefi: FormattedValue
		valueLockedInDefiUsd: FormattedValue
		fxrpLockedInDefi: FormattedValue
		totalDefiTransactions: FormattedValue
		totalMinters: FormattedValue
		mintCount: FormattedValue
		burnCount: FormattedValue
		swapCount: FormattedValue
	}
}

const DONUT_PALETTE = [FLARE_ORANGE, FLARE_PINK, '#7C2D9C', FLARE_BLUE, FLARE_GREEN, '#FBBF24', '#06B6D4', '#A855F7']

export default function FAssets() {
	const query = useQuery<FAssetsAPIResponse>({
		queryKey: ['flare-fassets'],
		queryFn: async () => {
			const res = await fetch('/api/public/flare/fAssets')
			if (!res.ok) throw new Error(`Flare fAssets API error: ${res.status}`)
			return res.json()
		},
		staleTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false
	})

	const onContentReady = useContentReady()

	useEffect(() => {
		if (query.data) onContentReady()
	}, [query.data, onContentReady])

	const charts = useMemo(() => {
		if (!query.data) return null
		const locked = query.data.lockedOverTimeChart
		const dist = query.data.distributionChart

		const lockedSeries = locked ? locked.series.filter((s) => /USD/i.test(s.name)) : []
		const lockedFinalSeries = lockedSeries.length > 0 ? lockedSeries : (locked?.series.slice(0, 1) ?? [])

		const distData =
			dist && dist.series[0] ? dist.labels.map((name, i) => ({ name, value: dist.series[0].data[i] ?? 0 })) : []

		return {
			locked:
				locked && lockedFinalSeries.length > 0
					? {
							title: locked.title ?? 'FXRP Locked in DeFi Over Time',
							data: chartToData({ ...locked, series: lockedFinalSeries }),
							stacks: lockedFinalSeries.map((s) => s.name)
						}
					: null,
			dist:
				distData.length > 0
					? {
							title: dist?.title ?? 'FXRP Distribution Across DeFi Protocols',
							data: distData,
							colors: Object.fromEntries(distData.map((d, i) => [d.name, DONUT_PALETTE[i % DONUT_PALETTE.length]]))
						}
					: null
		}
	}, [query.data])

	if (!query.data || !charts) return null

	const k = query.data.kpis

	return (
		<div className="flex flex-col gap-6">
			{query.data.narrative && <NarrativeCallout>{query.data.narrative}</NarrativeCallout>}

			<SectionHeader>FXRP</SectionHeader>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<KpiCard label="Total FXRP Supply" value={k.totalFxrpSupply.formatted} />
				<KpiCard label="% Locked in DeFi" value={k.pctLockedInDefi.formatted} />
				<KpiCard label="Value Locked in DeFi" value={k.valueLockedInDefiUsd.formatted} />
				<KpiCard label="FXRP Locked in DeFi" value={k.fxrpLockedInDefi.formatted} />
			</div>

			{charts.locked && (
				<ChartCard title={charts.locked.title} subtitle="USD value of FXRP locked in Flare DeFi over time.">
					<AreaChart
						chartData={charts.locked.data}
						stacks={charts.locked.stacks}
						stackColors={{ [charts.locked.stacks[0]]: FLARE_PINK }}
						valueSymbol="$"
						title=""
						height="360px"
						chartOptions={lastNDaysZoom(charts.locked.data.length)}
					/>
				</ChartCard>
			)}

			{charts.dist && (
				<ChartCard title={charts.dist.title} subtitle="Share of FXRP locked, by DeFi protocol.">
					<div className="mx-auto w-full max-w-3xl">
						<PieChart
							chartData={charts.dist.data}
							stackColors={charts.dist.colors}
							radius={['45%', '72%']}
							showLegend
							legendPosition={{ orient: 'vertical', left: 'right', top: 'middle' }}
							valueSymbol="$"
							title=""
							height="360px"
						/>
					</div>
				</ChartCard>
			)}

			<SectionHeader>Activity</SectionHeader>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				<KpiCard label="Total DeFi Txns" value={k.totalDefiTransactions.formatted} />
				<KpiCard label="Total Minters" value={k.totalMinters.formatted} />
				<KpiCard label="Mints" value={k.mintCount.formatted} />
				<KpiCard label="Burns" value={k.burnCount.formatted} />
				<KpiCard label="Swaps" value={k.swapCount.formatted} />
			</div>
		</div>
	)
}
