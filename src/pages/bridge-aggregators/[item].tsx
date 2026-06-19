import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/bridge-aggregators/${encodeRouteSegment(item)}`, true)
}

export default function BridgeAggregator() {
	return <div>BridgeAggregator</div>
}

export const getServerSideProps = withServerSidePropsTelemetry('/bridge-aggregators/[item]', getServerSidePropsHandler)
