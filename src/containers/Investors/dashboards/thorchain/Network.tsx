import type { Chart, Kpi } from './transform'
import { KpiGrid, PageLoader, PendulumBar, SectionHeader, TimeAreaCard, TimeBarCard, useThorchainData } from './ui'

interface NetworkData {
	incomeChart: Chart
	pendulumChart: Chart
	pendulum: { bondedSharePct: number; optimalBondedSharePct: number; state: string }
	kpis: Record<string, Kpi | undefined>
	bond: { bondChart: Chart; kpis: { bondedRuneNow?: Kpi } } | null
}

const INCOME_KPIS: [string, string][] = [
	['systemIncome30d', 'System Income (30d)'],
	['liquidityFees30d', 'Liquidity Fees (30d)'],
	['blockRewards30d', 'Block Rewards (30d)'],
	['nodeEarnings30d', 'Node Earnings (30d)'],
	['lpEarnings30d', 'LP Earnings (30d)'],
	['nodeSharePct', 'Node Share']
]

const BONDING_KPIS: [string, string][] = [
	['totalBonded', 'Total Bonded'],
	['bondedSharePct', 'Bonded Share'],
	['bondingApy', 'Bonding APY'],
	['liquidityApy', 'Liquidity APY'],
	['securityRatio', 'Security Ratio'],
	['totalPooledRune', 'Total Pooled RUNE']
]

const NODES_KPIS: [string, string][] = [
	['activeNodes', 'Active Nodes'],
	['standbyNodes', 'Standby Nodes'],
	['reserve', 'Reserve'],
	['reserveRune', 'Reserve RUNE']
]

export default function Network() {
	// `liquidity` lives on this payload too but renders on Overview, not here.
	const { data } = useThorchainData<NetworkData>('network')
	if (!data) return <PageLoader />

	const { incomeChart, pendulumChart, pendulum, kpis, bond } = data

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader>Network Economics & Security</SectionHeader>
			<KpiGrid kpis={kpis} items={INCOME_KPIS} label="System Income" />
			<KpiGrid kpis={kpis} items={BONDING_KPIS} label="Bonding & Security" />
			<KpiGrid kpis={kpis} items={NODES_KPIS} label="Nodes & Reserve" />

			<PendulumBar
				bondedSharePct={pendulum.bondedSharePct}
				optimalBondedSharePct={pendulum.optimalBondedSharePct}
				state={pendulum.state}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<TimeBarCard chart={incomeChart} value={kpis.systemIncome30d?.formatted} />
				<TimeBarCard
					chart={pendulumChart}
					subtitle="Daily system income split between node bonders and liquidity providers."
				/>
			</div>

			{bond && <TimeAreaCard chart={bond.bondChart} valueSymbol="" value={bond.kpis.bondedRuneNow?.formatted} />}
		</div>
	)
}
