import { protocolTvlByChainBreakdown } from '~/containers/ProtocolOverview/server/tvlBreakdowns'
import { toNextHandler } from '~/server/api/nextAdapter'

/**
 * @deprecated Legacy ProDashboard chart-builder endpoint for protocol TVL
 * by-chain breakdowns. Migrate chart builder to v2 metric/chart APIs with
 * display-name chain keys before removing this route.
 */
export default toNextHandler(protocolTvlByChainBreakdown)
