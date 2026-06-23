import { getProtocolIncomeStatement } from '~/containers/ProtocolOverview/queries'
import { getProtocolUnlocksStaticPropsData } from '~/containers/Unlocks/protocolUnlocksStaticProps'
import type { IProtocolMetadata } from '~/utils/metadata/types'

// THORChain's emissions live under the DEX protocol slug on DefiLlama.
const DEX = 'thorchain-dex'

// THORChain is a chain, not a DefiLlama protocol (only thorchain-dex/-lending exist), so the
// metadata-gated /api/public/income-statement route can't resolve `thorchain`. The upstream
// financial-statement endpoint does have chain data, so we fetch it here server-side (where
// SERVER_URL is keyed) via getProtocolIncomeStatement with a synthetic metadata whose displayName
// slugs to "thorchain" — no appMetadata entry required.
const CHAIN_INCOME_METADATA = { displayName: 'THORChain', fees: true, revenue: true } as IProtocolMetadata

export interface ThorchainServerData {
	emissions: Awaited<ReturnType<typeof getProtocolUnlocksStaticPropsData>>['emissions']
	initialTokenMarketData: Awaited<ReturnType<typeof getProtocolUnlocksStaticPropsData>>['initialTokenMarketData']
	chainIncomeStatement: Awaited<ReturnType<typeof getProtocolIncomeStatement>>
}

export type ThorchainUnlocks = Pick<ThorchainServerData, 'emissions' | 'initialTokenMarketData'>
export type ThorchainChainIncome = ThorchainServerData['chainIncomeStatement']

// Fetched server-side (keyed pro API) so the dashboard gets data the in-browser code can't: the
// rate-limited all-emissions list behind Locked/Unlocked %, and the chain income statement that the
// protocol-gated /api/public/income-statement route 404s on. Only the processed JSON is sent to the
// client — the API key never leaves the server.
export async function fetchThorchainServerData(): Promise<ThorchainServerData> {
	const metadata = (await import('~/utils/metadata')).default
	const [unlocks, chainIncomeStatement] = await Promise.all([
		getProtocolUnlocksStaticPropsData(DEX, metadata.tokenlist, metadata.emissionsProtocolsList),
		getProtocolIncomeStatement({ metadata: CHAIN_INCOME_METADATA }).catch(() => null)
	])
	return {
		emissions: unlocks.emissions,
		initialTokenMarketData: unlocks.initialTokenMarketData,
		chainIncomeStatement
	}
}
