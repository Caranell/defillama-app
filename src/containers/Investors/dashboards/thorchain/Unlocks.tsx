import { Suspense } from 'react'
import { UnlocksPieCard } from '~/containers/ProDashboard/components/UnlocksPieCard'
import { UnlocksScheduleCard } from '~/containers/ProDashboard/components/UnlocksScheduleCard'
import { ProDashboardAPIProvider } from '~/containers/ProDashboard/ProDashboardAPIContext'
import { SectionHeader } from './ui'

// DefiLlama protocol slug carrying THORChain's unlocks/emissions data (the DEX adapter).
const DEX = 'thorchain-dex'
const NAME = 'THORChain'

function Frame({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-lg border border-(--cards-border) bg-(--cards-bg) p-2" style={{ minHeight: 360 }}>
			<Suspense fallback={null}>{children}</Suspense>
		</div>
	)
}

// RUNE token unlocks — sourced entirely from DefiLlama's emissions data via ProDashboard's
// unlocks cards. The bare provider (no initialDashboardId → streamDone immediately true) is all
// the cards need; AppMetadataProvider is already at the dashboard root.
export default function Unlocks() {
	return (
		<ProDashboardAPIProvider>
			<div className="flex flex-col gap-6">
				<SectionHeader>RUNE Token Unlocks</SectionHeader>
				<Frame>
					<UnlocksScheduleCard
						config={{
							id: `tc-unlocks-${DEX}`,
							kind: 'unlocks-schedule',
							protocol: DEX,
							protocolName: NAME,
							dataType: 'documented'
						}}
					/>
				</Frame>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Frame>
						<UnlocksPieCard
							config={{
								id: `tc-unlockspie-allocation-${DEX}`,
								kind: 'unlocks-pie',
								protocol: DEX,
								protocolName: NAME,
								chartType: 'allocation'
							}}
						/>
					</Frame>
					<Frame>
						<UnlocksPieCard
							config={{
								id: `tc-unlockspie-locked-unlocked-${DEX}`,
								kind: 'unlocks-pie',
								protocol: DEX,
								protocolName: NAME,
								chartType: 'locked-unlocked'
							}}
						/>
					</Frame>
				</div>
			</div>
		</ProDashboardAPIProvider>
	)
}
