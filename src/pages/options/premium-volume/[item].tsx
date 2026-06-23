import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/options/${encodeRouteSegment(item)}`, true)
}

export default function PremiumVolume() {
	return <div>PremiumVolume</div>
}

export const getServerSideProps = withServerSidePropsTelemetry(
	'/options/premium-volume/[item]',
	getServerSidePropsHandler
)
