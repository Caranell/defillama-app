import { useQuery } from '@tanstack/react-query'
import { lazy, useEffect, useMemo } from 'react'
import type { IChartProps } from '~/components/ECharts/types'
import { useContentReady } from '~/containers/Investors/ContentReadyContext'
import { FLARE_PINK, lastNDaysZoom } from './chartDefaults'
import { chartToData, type UpstreamChart } from './transform'
import { ChartCard, KpiCard, SectionHeader } from './ui'

const AreaChart = lazy(() => import('~/components/ECharts/AreaChart')) as React.FC<IChartProps>

interface FormattedValue {
	value: number
	formatted: string
}

interface OverviewAPIResponse {
	tvl: {
		tvlChart: UpstreamChart
		kpis: { currentTvl: FormattedValue }
	}
	stablecoins: {
		stablecoinChart: UpstreamChart
		kpis: {
			currentCirculating: FormattedValue
			currentMinted: FormattedValue
			currentBridged: FormattedValue
		}
	}
	fxrp?: {
		kpis: {
			totalFxrpSupply: FormattedValue
			pctLockedInDefi: FormattedValue
			valueLockedInDefiUsd: FormattedValue
		}
	}
}

export default function Overview() {
	const query = useQuery<OverviewAPIResponse>({
		queryKey: ['flare-overview'],
		queryFn: async () => {
			const res = await fetch('/api/public/flare/overview')
			if (!res.ok) throw new Error(`Flare overview API error: ${res.status}`)
			return res.json()
		},
		staleTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false
	})

	const onContentReady = useContentReady()

	useEffect(() => {
		if (query.data) onContentReady()
	}, [query.data, onContentReady])

	const data = useMemo(() => {
		if (!query.data) return null
		const t = query.data.tvl
		const s = query.data.stablecoins
		const stackSeries = s.stablecoinChart.series.filter((x) => !/total/i.test(x.name))
		return {
			fxrp: query.data.fxrp?.kpis ?? null,
			tvl: {
				title: t.tvlChart.title ?? 'Flare TVL',
				chartData: chartToData(t.tvlChart),
				stacks: t.tvlChart.series.map((x) => x.name),
				currentFormatted: t.kpis.currentTvl.formatted
			},
			stables: {
				title: s.stablecoinChart.title ?? 'Stablecoin Supply on Flare',
				chartData: chartToData({ ...s.stablecoinChart, series: stackSeries }),
				stacks: stackSeries.map((x) => x.name),
				kpis: {
					total: s.kpis.currentCirculating,
					native: s.kpis.currentMinted,
					bridged: s.kpis.currentBridged
				}
			}
		}
	}, [query.data])

	if (!data) return null

	const { tvl, stables, fxrp } = data

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader>Chain Ecosystem</SectionHeader>
			<ChartCard
				title={tvl.title}
				subtitle="Total value locked across Flare DeFi protocols."
				value={tvl.currentFormatted}
			>
				<AreaChart
					chartData={tvl.chartData}
					stacks={tvl.stacks}
					stackColors={Object.fromEntries(tvl.stacks.map((s) => [s, FLARE_PINK]))}
					valueSymbol="$"
					title=""
					height="360px"
					chartOptions={lastNDaysZoom(tvl.chartData.length)}
				/>
			</ChartCard>

			{fxrp && (
				<>
					<SectionHeader>FXRP</SectionHeader>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<KpiCard label="Total FXRP Supply" value={fxrp.totalFxrpSupply.formatted} />
						<KpiCard label="% Locked in DeFi" value={fxrp.pctLockedInDefi.formatted} />
						<KpiCard label="Value Locked in DeFi" value={fxrp.valueLockedInDefiUsd.formatted} />
					</div>
				</>
			)}

			<SectionHeader>Stablecoins</SectionHeader>
			<div className="grid grid-cols-3 gap-4">
				<KpiCard label="Total" value={stables.kpis.total.formatted} />
				<KpiCard label="Native Minted" value={stables.kpis.native.formatted} />
				<KpiCard label="Bridged" value={stables.kpis.bridged.formatted} />
			</div>

			<ChartCard title={stables.title} subtitle="Stablecoin supply circulating on Flare — native-minted vs. bridged.">
				<AreaChart
					chartData={stables.chartData}
					stacks={stables.stacks}
					valueSymbol="$"
					title=""
					isStackedChart
					hideGradient
					height="360px"
					chartOptions={lastNDaysZoom(stables.chartData.length)}
				/>
			</ChartCard>
		</div>
	)
}
