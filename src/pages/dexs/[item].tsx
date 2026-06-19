import type { GetServerSideProps } from 'next'
import { canonicalRouteRedirect, encodeRouteSegment, getSingleRouteParam } from '~/utils/route'
import { withServerSidePropsTelemetry } from '~/utils/telemetry'

const getServerSidePropsHandler: GetServerSideProps = async (context) => {
	const item = getSingleRouteParam(context.params?.item)
	if (!item) return { notFound: true }

	return canonicalRouteRedirect(`/protocol/dexs/${encodeRouteSegment(item)}`, true)
}

export default function Dex() {
	return <div>Dex</div>
}

export const getServerSideProps = withServerSidePropsTelemetry('/dexs/[item]', getServerSidePropsHandler)
