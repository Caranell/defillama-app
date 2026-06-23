import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/fees/${encodeRouteSegment(item)}`, true)
}

export default function Fees() {
	return <div>Fees</div>
}

export const getServerSideProps = withServerSidePropsTelemetry('/fees/[item]', getServerSidePropsHandler)
