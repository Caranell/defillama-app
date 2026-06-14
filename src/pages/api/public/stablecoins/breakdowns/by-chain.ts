import { stablecoinByChainBreakdown } from '~/containers/Stablecoins/server/breakdowns'
import { toNextHandler } from '~/server/api/nextAdapter'

/**
 * @deprecated Legacy ProDashboard chart-builder endpoint for stablecoin
 * by-chain breakdowns. Migrate chart builder to v2 metric/chart APIs with
 * display-name chain keys before removing this route.
 */
export default toNextHandler(stablecoinByChainBreakdown)
