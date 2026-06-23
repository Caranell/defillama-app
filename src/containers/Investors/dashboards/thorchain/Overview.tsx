import { useQuery } from '@tanstack/react-query'
import ChainCharts from '~/containers/ProDashboard/services/ChainCharts'
import ProtocolCharts from '~/containers/ProDashboard/services/ProtocolCharts'
import { formattedNum } from '~/utils'
import { FeeRevenueChart, MetricTrendChart, SeriesAreaChart } from './ChainBreakdownChart'
import type { ApiTableData, Chart, Distribution, Kpi as KpiT } from './transform'
import {
	ApiTable,
	CategoryBarCard,
	DonutCard,
	Kpi,
	KpiGrid,
	PageLoader,
	SectionHeader,
	TimeAreaCard,
	useThorchainData
} from './ui'

interface OverviewData {
	kpis: {
		thorchain?: Record<string, KpiT | undefined>
		thorchainDex?: Record<string, KpiT | undefined>
	}
	tvlChart: Chart
}

const DAY = 86400
const DEX = 'thorchain-dex'

// Chain-level fees/revenue (30d) from DefiLlama's dimensions API (ChainCharts is context-free).
function useChain30d(metric: 'fees' | 'revenue') {
	return useQuery({
		queryKey: ['thorchain-chain-30d', metric],
		queryFn: async () => {
			const series = metric === 'fees' ? await ChainCharts.fees('thorchain') : await ChainCharts.revenue('thorchain')
			if (!series?.length) return null
			const cutoff = series[series.length - 1][0] - 30 * DAY
			const sum = series.reduce((acc, [t, v]) => (t > cutoff ? acc + (v || 0) : acc), 0)
			return { value: sum, formatted: formattedNum(sum, true) }
		},
		staleTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false
	})
}

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'

export default function Overview() {
	const { data } = useThorchainData<OverviewData>('overview')
	// DEX liquidity composition currently lives on the network endpoint.
	const { data: net } = useThorchainData<{ liquidity?: LiquidityData }>('network')
	const chainFees = useChain30d('fees')
	const chainRevenue = useChain30d('revenue')
	if (!data) return <PageLoader />

	const chain = data.kpis.thorchain ?? {}
	const dex = data.kpis.thorchainDex ?? {}

	return (
		<div className="flex flex-col gap-10">
			{/* Chain data first. */}
			<section className="flex flex-col gap-6">
				<SectionHeader>THORChain (Chain)</SectionHeader>
				<div className={GRID}>
					<Kpi kpi={chain.tvl} label="TVL" />
					<Kpi kpi={chainFees.data ?? undefined} label="Chain Fees (30d)" note="chain dailyAppFees" />
					<Kpi kpi={chainRevenue.data ?? undefined} label="Chain Revenue (30d)" note="chain dailyAppRevenue" />
				</div>

				<TimeAreaCard
					chart={data.tvlChart}
					subtitle="Total value locked across the THORChain chain."
					value={chain.tvl?.formatted}
				/>
				<FeeRevenueChart source="chain" title="Chain Fees & Revenue" subtitle="Chain-level app fees and revenue." />
			</section>

			{/* Then DEX data. */}
			<section className="flex flex-col gap-6">
				<SectionHeader>THORChain DEX</SectionHeader>
				<div className={GRID}>
					<Kpi kpi={dex.tvl} label="DEX TVL" />
					<Kpi kpi={dex.dexVolume30d} label="DEX Volume (30d)" />
					<Kpi kpi={dex.fees30d} label="Fees (30d)" />
					<Kpi kpi={dex.revenue30d} label="Revenue (30d)" />
					<Kpi kpi={dex.holdersRevenue30d} label="Holders Revenue (30d)" />
					<Kpi kpi={dex.supplySideRevenue30d} label="Supply-side Revenue (30d)" />
				</div>

				<SeriesAreaChart
					title="DEX TVL"
					subtitle="Pooled liquidity in the THORChain DEX."
					name="TVL"
					value={dex.tvl?.formatted}
					zoomDays={60}
					queryKey={['thorchain-dex-tvl']}
					queryFn={() => ProtocolCharts.tvl(DEX)}
				/>
				<FeeRevenueChart
					source="dex"
					title="DEX Fees & Revenue"
					subtitle="Swap fees and protocol revenue from the THORChain DEX adapter."
				/>
				<MetricTrendChart
					title="DEX Volume"
					subtitle="Cumulative swap volume."
					name="Volume"
					queryKey={['thorchain-dex-volume']}
					queryFn={() => ProtocolCharts.volume(DEX)}
					defaultView="cumulative"
				/>
			</section>

			{net?.liquidity && <LiquiditySection liquidity={net.liquidity} />}
		</div>
	)
}

export interface LiquidityData {
	tvlChart: Chart
	tvlByChainChart: Chart
	distribution: Distribution
	chainDistribution: Distribution
	tokenBreakdown: Distribution
	tokenValues: ApiTableData
	poolDepthChart: Chart
	pools: ApiTableData
	kpis: Record<string, KpiT | undefined>
}

const LIQUIDITY_KPIS: [string, string][] = [
	['tvl', 'TVL'],
	['pooledLiquidity', 'Pooled Liquidity'],
	['poolCount', 'Pools'],
	['majorsShare', 'Majors Share'],
	['stablecoinsShare', 'Stablecoins Share'],
	['topPoolByDepth', 'Top Pool by Depth'],
	['saversDepth', 'Savers Depth'],
	['saverPools', 'Saver Pools']
]

// DEX liquidity: pooled-liquidity composition (by token / asset class / chain), pool depth
// and pools. The TVL it composes is the DEX/pooled-liquidity TVL, shown separately above.
// Data comes from the network endpoint's `liquidity` object.
function LiquiditySection({ liquidity }: { liquidity: LiquidityData }) {
	return (
		<section className="flex flex-col gap-6">
			<SectionHeader>DEX Liquidity</SectionHeader>
			<KpiGrid kpis={liquidity.kpis} items={LIQUIDITY_KPIS} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DonutCard dist={liquidity.tokenBreakdown} subtitle="Pooled liquidity by token." />
				<div className="rounded-lg border border-(--cards-border) bg-(--cards-bg) p-4">
					<h3 className="mb-3 text-sm font-semibold text-(--text-primary)">
						{liquidity.tokenValues.title ?? 'Token Values'}
					</h3>
					<ApiTable table={liquidity.tokenValues} maxHeight="420px" />
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<DonutCard dist={liquidity.distribution} subtitle="Pooled liquidity by asset class." />
				<DonutCard dist={liquidity.chainDistribution} subtitle="Pooled liquidity by connected chain." />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<CategoryBarCard chart={liquidity.poolDepthChart} />
				<div className="rounded-lg border border-(--cards-border) bg-(--cards-bg) p-4">
					<h3 className="mb-3 text-sm font-semibold text-(--text-primary)">
						{liquidity.pools.title ?? 'Pools by Depth'}
					</h3>
					<ApiTable table={liquidity.pools} maxHeight="420px" />
				</div>
			</div>
		</section>
	)
}
