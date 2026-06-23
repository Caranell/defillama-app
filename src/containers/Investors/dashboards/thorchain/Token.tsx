import { useQuery } from '@tanstack/react-query'
import { COINS_SERVER_URL } from '~/constants'
import { formattedNum } from '~/utils'
import { SeriesAreaChart } from './ChainBreakdownChart'
import type { Chart, Kpi } from './transform'
import { KpiGrid, PageLoader, SectionHeader, TimeBarCard, useThorchainData } from './ui'

interface TokenData {
	rune: { kpis: Record<string, Kpi | undefined> }
	tcy: { yieldChart: Chart; kpis: Record<string, Kpi | undefined> }
}

// RUNE price from DefiLlama's public coins API (no CG_KEY needed, unlike the cg-chart route).
async function fetchRunePrice(): Promise<Array<[number, number]>> {
	const res = await fetch(`${COINS_SERVER_URL}/chart/coingecko:thorchain?span=400&period=1d`)
	if (!res.ok) return []
	const json = await res.json()
	const prices: Array<{ timestamp: number; price: number }> = json?.coins?.['coingecko:thorchain']?.prices ?? []
	return prices.map((p) => [p.timestamp, p.price] as [number, number])
}

const RUNE_KPIS: [string, string][] = [
	['marketCap', 'Market Cap'],
	['fdv', 'FDV'],
	['circulatingSupply', 'Circulating Supply'],
	['totalSupply', 'Total Supply']
]

const TCY_KPIS: [string, string][] = [
	['tcySupply', 'Supply'],
	['tcyMarketCap', 'Market Cap'],
	['tcyFeeShare', 'Fee Share'],
	['tcyYield30d', 'Yield (30d)'],
	['tcyYieldLifetime', 'Yield (Lifetime)'],
	['tcyYieldLifetimeUsd', 'Yield USD (Lifetime)'],
	['annualizedTcyYield', 'Annualized Yield']
]

export default function Token() {
	const { data } = useThorchainData<TokenData>('token')
	const tcyPrice = useQuery({
		queryKey: ['thorchain-tcy-price'],
		queryFn: async (): Promise<number | null> => {
			const res = await fetch(`${COINS_SERVER_URL}/prices/current/coingecko:tcy`)
			if (!res.ok) return null
			const json = await res.json()
			return json?.coins?.['coingecko:tcy']?.price ?? null
		},
		staleTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false
	})
	if (!data) return <PageLoader />

	const supply = data.tcy.kpis.tcySupply?.value
	const tcyMarketCap =
		tcyPrice.data != null && supply != null
			? { value: tcyPrice.data * supply, formatted: formattedNum(tcyPrice.data * supply, true) }
			: undefined
	const tcyKpis = { ...data.tcy.kpis, tcyMarketCap }

	return (
		<div className="flex flex-col gap-10">
			<section className="flex flex-col gap-6">
				<SectionHeader>RUNE</SectionHeader>
				<KpiGrid kpis={data.rune.kpis} items={RUNE_KPIS} />
				<SeriesAreaChart
					title="RUNE Price"
					subtitle="RUNE spot price over time."
					name="RUNE Price"
					value={data.rune.kpis.runePrice?.formatted}
					queryKey={['thorchain-rune-price']}
					queryFn={fetchRunePrice}
				/>
			</section>

			<section className="flex flex-col gap-6">
				<SectionHeader>TCY</SectionHeader>
				<KpiGrid kpis={tcyKpis} items={TCY_KPIS} />
				<TimeBarCard chart={data.tcy.yieldChart} value={data.tcy.kpis.tcyYield30d?.formatted} />
			</section>
		</div>
	)
}
