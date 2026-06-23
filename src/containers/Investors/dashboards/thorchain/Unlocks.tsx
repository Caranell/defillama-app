import { useCustomServerData } from '~/containers/Investors/CustomServerDataContext'
import { EmissionsByProtocol } from '~/containers/Unlocks/EmissionsByProtocol'
import type { ThorchainUnlocksServerData } from './serverData'
import { SectionHeader } from './ui'

// RUNE token unlocks — rendered with the same EmissionsByProtocol component as /unlocks/thorchain-dex,
// fed by server-side data (keyed pro API) via the customServerData pipeline. Server keying is required:
// the all-emissions list behind Locked/Unlocked % is rate-limited on the free public host, which is why
// the in-browser ProDashboard cards (client-side, unkeyed) rendered it empty.
export default function Unlocks() {
	const data = useCustomServerData<ThorchainUnlocksServerData>('thorchainUnlocks')

	return (
		<div className="flex flex-col gap-6">
			<SectionHeader>RUNE Token Unlocks</SectionHeader>
			{data?.emissions ? (
				<EmissionsByProtocol
					data={data.emissions}
					initialTokenMarketData={data.initialTokenMarketData}
					isEmissionsPage
					disableClientTokenStatsFetch
				/>
			) : (
				<p className="flex h-[360px] items-center justify-center text-center text-xs text-(--text-tertiary)">
					No unlocks data.
				</p>
			)}
		</div>
	)
}
