import { adapterMetricBreakdown } from '~/containers/AdapterMetrics/server/breakdownRoutes'
import { toNextHandler } from '~/server/api/nextAdapter'

/**
 * @deprecated Legacy ProDashboard chart-builder endpoint backed by Dimensions
 * overview/summary payloads. Migrate chart builder to v2 metric/chart APIs
 * with display-name chain keys before removing this route.
 */
export default toNextHandler(adapterMetricBreakdown)
