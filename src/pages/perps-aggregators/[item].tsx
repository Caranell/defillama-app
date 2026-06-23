import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/perps-aggregators/${encodeRouteSegment(item)}`, true)
}

export default function PerpsAggregator() {
	return <div>PerpsAggregator</div>
}

export const getServerSideProps = withServerSidePropsTelemetry('/perps-aggregators/[item]', getServerSidePropsHandler)
