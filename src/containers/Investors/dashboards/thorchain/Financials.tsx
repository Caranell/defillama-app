import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useCustomServerData } from '~/containers/Investors/CustomServerDataContext'
import { IncomeStatement } from '~/containers/ProtocolOverview/IncomeStatement'
import { ChainBreakdownChart } from './ChainBreakdownChart'
import type { ThorchainChainIncome } from './serverData'
import type { ApiTableData, Chart, Distribution, Kpi as KpiT } from './transform'
import {
	ApiTable,
	ChartCard,
	DonutCard,
	Kpi,
	KpiBand,
	KpiGrid,
	PageLoader,
	SectionHeader,
	SegToggle,
	TimeBarCard,
	ToggledTimeChart,
	useThorchainData
} from './ui'

// DefiLlama protocol slug carrying THORChain's fees/revenue/income-statement (the DEX adapter).
const DEX = 'thorchain-dex'
const NAME = 'THORChain'

// Same setup as odyssey's MetronomeIncomeStatement: render the shared ProtocolOverview component with
// a Table/Sankey toggle. The DEX statement comes from the internal income-statement route (`protocol`);
// the chain statement is pre-fetched server-side (`statement`) since the chain isn't a DefiLlama
// protocol and that route can't resolve it.
function ThorchainIncomeStatement({
	protocol,
	title,
	subtitle,
	statement
}: {
	protocol?: string
	title: string
	subtitle?: string
	statement?: ThorchainChainIncome
}) {
	const [view, setView] = useState<'table' | 'sankey'>('table')
	const query = useQuery({
		queryKey: ['thorchain-income-statement', protocol],
		queryFn: () => fetch(`/api/public/income-statement?protocol=${protocol}`).then((r) => (r.ok ? r.json() : null)),
		enabled: !statement && Boolean(protocol),
		retry: 2,
		staleTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false
	})
	const data = statement ?? query.data
	const isLoading = !statement && query.isLoading
	const hasData =
		data?.data && (['monthly', 'quarterly', 'yearly'] as const).some((k) => Object.keys(data.data[k] ?? {}).length > 0)

	return (
		<ChartCard
			title={title}
			subtitle={subtitle}
			control={
				<SegToggle
					options={[
						{ value: 'table', label: 'Table' },
						{ value: 'sankey', label: 'Sankey' }
					]}
					value={view}
					onChange={(v) => setView(v)}
				/>
			}
		>
			{isLoading ? (
				<div className="flex h-[320px] items-center justify-center text-xs text-(--text-tertiary)">Loading…</div>
			) : hasData ? (
				<IncomeStatement
					name={NAME}
					incomeStatement={data}
					view={view}
					anchorId={`thorchain-income-${protocol ?? 'chain'}`}
					showTitles={false}
					className="border-none bg-transparent p-0"
				/>
			) : (
				<div className="flex h-[320px] items-center justify-center text-xs text-(--text-tertiary)">
					No income statement data
				</div>
			)}
		</ChartCard>
	)
}

interface FinancialsData {
	kpis: Record<string, KpiT | undefined>
	distribution: Distribution
	affiliate: {
		leaderboard: ApiTableData
		topShareDonut: Distribution
		monthlyChart: Chart
		kpis: Record<string, KpiT | undefined>
	} | null
	burn: { burnChart: Chart; kpis: Record<string, KpiT | undefined> }
}

const AFFILIATE_KPIS: [string, string][] = [
	['affiliateLifetime', 'Affiliate (Lifetime)'],
	['affiliate30d', 'Affiliate (30d)'],
	['topAffiliate', 'Top Affiliate'],
	['affiliateCount', 'Affiliates']
]

const BURN_KPIS: [string, string][] = [
	['burnedLifetime', 'Burned (Lifetime)'],
	['burnedLifetimeUsd', 'Burned USD (Lifetime)'],
	['burned30d', 'Burned (30d)'],
	['burned30dUsd', 'Burned USD (30d)'],
	['burnRate', 'Burn Rate']
]

export default function Financials() {
	const { data } = useThorchainData<FinancialsData>('financials')
	const chainIncome = useCustomServerData<ThorchainChainIncome>('thorchainChainIncome')
	if (!data) return <PageLoader />

	const { kpis, distribution, affiliate, burn } = data

	return (
		<div className="flex flex-col gap-10">
			<section className="flex flex-col gap-6">
				<SectionHeader>Fees & Revenue</SectionHeader>

				<KpiBand label="Fees">
					<Kpi kpi={kpis.feesLifetime} label="Lifetime" />
					<Kpi kpi={kpis.fees1y} label="1Y" />
					<Kpi kpi={kpis.fees30d} label="30d" />
					<Kpi kpi={kpis.fees7d} label="7d" />
				</KpiBand>

				<KpiBand label="Revenue">
					<Kpi kpi={kpis.revenueLifetime} label="Lifetime" />
					<Kpi kpi={kpis.revenue1y} label="1Y" />
					<Kpi kpi={kpis.revenue30d} label="30d" />
					<Kpi kpi={kpis.revenueMargin} label="Margin" />
				</KpiBand>

				<KpiBand label="Revenue Composition">
					<Kpi kpi={kpis.userFeesLifetime} label="User Fees (Lifetime)" />
					<Kpi kpi={kpis.supplySideRevenueLifetime} label="Supply-side (Lifetime)" />
					<Kpi kpi={kpis.protocolRevenueLifetime} label="Protocol (Lifetime)" />
					<Kpi kpi={kpis.holdersRevenueLifetime} label="Holders (Lifetime)" />
					<Kpi kpi={kpis.supplySideRevenue30d} label="Supply-side (30d)" />
					<Kpi kpi={kpis.holdersRevenue30d} label="Holders (30d)" />
					<Kpi kpi={kpis.nodesPoolsShare} label="Nodes & Pools Share" />
					<Kpi kpi={kpis.topChainByFees} label="Top Chain by Fees" />
				</KpiBand>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<ChainBreakdownChart metric="fees" title="DEX Fees by Chain" />
					<ChainBreakdownChart metric="revenue" title="DEX Revenue by Chain" />
				</div>

				<DonutCard
					dist={distribution}
					subtitle="30-day system income split across nodes, LPs, TCY stakers, funds and burn."
				/>
			</section>

			{/* Internal DefiLlama income statements (odyssey pattern), one per protocol, each with a Table/Sankey toggle. */}
			<section className="flex flex-col gap-6">
				<SectionHeader>Income Statements</SectionHeader>
				<ThorchainIncomeStatement
					title="THORChain (Chain) Income Statement"
					subtitle="Chain-level fees & revenue across all THORChain activity."
					statement={chainIncome}
				/>
				<ThorchainIncomeStatement
					protocol={DEX}
					title="THORChain DEX Income Statement"
					subtitle="Swap fees & protocol revenue from the THORChain DEX adapter."
				/>
			</section>

			{affiliate && (
				<section className="flex flex-col gap-6">
					<SectionHeader>Affiliate Fees</SectionHeader>
					<KpiGrid kpis={affiliate.kpis} items={AFFILIATE_KPIS} />
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div className="rounded-lg border border-(--cards-border) bg-(--cards-bg) p-4">
							<h3 className="mb-3 text-sm font-semibold text-(--text-primary)">
								{affiliate.leaderboard.title ?? 'Affiliate Leaderboard'}
							</h3>
							<ApiTable table={affiliate.leaderboard} maxHeight="360px" />
						</div>
						<DonutCard dist={affiliate.topShareDonut} subtitle="Share of lifetime affiliate fees." />
					</div>
					<TimeBarCard chart={affiliate.monthlyChart} />
				</section>
			)}

			<section className="flex flex-col gap-6">
				<SectionHeader>RUNE Burn</SectionHeader>
				<KpiGrid kpis={burn.kpis} items={BURN_KPIS} />
				<ToggledTimeChart chart={burn.burnChart} value={burn.kpis.burned30d?.formatted} />
			</section>
		</div>
	)
}
