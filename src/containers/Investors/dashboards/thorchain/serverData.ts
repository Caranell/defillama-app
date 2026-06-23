import { getProtocolUnlocksStaticPropsData } from '~/containers/Unlocks/protocolUnlocksStaticProps'

// THORChain's emissions live under the DEX protocol slug on DefiLlama.
const DEX = 'thorchain-dex'

export type ThorchainUnlocksServerData = Pick<
	Awaited<ReturnType<typeof getProtocolUnlocksStaticPropsData>>,
	'emissions' | 'initialTokenMarketData'
>

// Fetch the unlocks/emissions server-side (where SERVER_URL is keyed → pro API), mirroring how
// /unlocks/[protocol] builds its props. This is required: Locked/Unlocked % reads the all-emissions
// list, which is rate-limited on the free public host — so the in-browser ProDashboard cards (which
// fetch client-side, unkeyed) came up empty for it.
export async function fetchThorchainUnlocksServerData(): Promise<ThorchainUnlocksServerData> {
	const metadata = (await import('~/utils/metadata')).default
	const result = await getProtocolUnlocksStaticPropsData(DEX, metadata.tokenlist, metadata.emissionsProtocolsList)
	// ponytail: temporary diagnostic — confirm the server fetch actually runs and what it returns.
	console.log('[thorchain unlocks] server fetch', {
		inList: metadata.emissionsProtocolsList?.includes?.(DEX) ?? null,
		emissionsNull: result.emissions == null,
		categoriesDoc: result.emissions?.categories?.documented?.length ?? null,
		events: result.emissions?.events?.length ?? null,
		maxSupply: result.emissions?.meta?.maxSupply ?? null,
		totalLocked: result.emissions?.meta?.totalLocked ?? null
	})
	return { emissions: result.emissions, initialTokenMarketData: result.initialTokenMarketData }
}
