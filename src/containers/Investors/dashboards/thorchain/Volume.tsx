import type { Chart, Kpi } from './transform'
import { KpiGrid, PageLoader, PlaceholderCard, SectionHeader, TimeBarCard, useThorchainData } from './ui'

interface VolumeData {
	kpis: Record<string, Kpi | undefined>
	volumeChart: Chart
	volumeByChainChart?: Chart
	swapCountChart: Chart
}

const KPI_ITEMS: [string, string][] = [
	['volumeLifetime', 'Volume (Lifetime)'],
	['volume30d', 'Volume (30d)'],
	['avgDailyVolume30d', 'Avg Daily Volume (30d)'],
	['allTimeSwaps', 'All-Time Swaps'],
	['swaps30d', 'Swaps (30d)'],
	['avgDailySwaps30d', 'Avg Daily Swaps (30d)'],
	['nativeShare30d', 'Native Share (30d)'],
	['tradeShare30d', 'Trade Acct Share (30d)'],
	['securedShare30d', 'Secured Share (30d)']
]

export default function Volume() {
	const { data } = useThorchainData<VolumeData>('volume')
	if (!data) return <PageLoader />

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader>Swap Volume</SectionHeader>
			<KpiGrid kpis={data.kpis} items={KPI_ITEMS} cols={3} />

			{/* By chain from ir-server (Midgard): DefiLlama attributes all THORChain volume to one chain. */}
			{data.volumeByChainChart?.series?.length ? (
				<TimeBarCard
					chart={data.volumeByChainChart}
					subtitle="Daily swap volume per source chain."
					value={data.kpis.volume30d?.formatted}
				/>
			) : (
				<PlaceholderCard
					title="Daily Swap Volume by Chain"
					subtitle="Daily swap volume per source chain."
					note="volume.volumeByChainChart"
				/>
			)}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<TimeBarCard chart={data.swapCountChart} valueSymbol="" value={data.kpis.swaps30d?.formatted} />
				<TimeBarCard
					chart={data.volumeChart}
					subtitle="Split by swap type — native swaps, trade accounts and secured assets."
				/>
			</div>
		</div>
	)
}
