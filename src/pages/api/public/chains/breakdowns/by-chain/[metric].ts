import { chainNativeByChainBreakdown } from '~/containers/ChainOverview/server/breakdowns'
import { toNextHandler } from '~/server/api/nextAdapter'

/**
 * @deprecated Legacy ProDashboard chart-builder endpoint for chain-fees and
 * chain-revenue. It is backed by Dimensions overview/summary payloads; migrate
 * chart builder to v2 metric/chart APIs with display-name chain keys first.
 */
export default toNextHandler(chainNativeByChainBreakdown)
