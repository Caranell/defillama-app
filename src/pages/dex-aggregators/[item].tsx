import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/dex-aggregators/${encodeRouteSegment(item)}`, true)
}

export default function DexAggregator() {
	return <div>DexAggregator</div>
}

export const getServerSideProps = withServerSidePropsTelemetry('/dex-aggregators/[item]', getServerSidePropsHandler)
