import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import { SKIP_BUILD_STATIC_GENERATION } from '~/constants'
import GovernanceProject from '~/containers/Governance/GovernanceProject'
import { getGovernanceDetailsPageData } from '~/containers/Governance/queries'
import { fetchProtocolOverviewMetrics } from '~/containers/ProtocolOverview/api'
import { ProtocolOverviewLayout } from '~/containers/ProtocolOverview/Layout'
import { getProtocolMetricFlags } from '~/containers/ProtocolOverview/queries'
import { getProtocolWarningBanners } from '~/containers/ProtocolOverview/utils'
import { maxAgeForNext } from '~/utils/maxAgeForNext'
import { withPerformanceLogging } from '~/utils/perf'
import { canonicalRouteRedirect } from '~/utils/route'

export const getStaticProps = withPerformanceLogging(
	'protocol/governance/[protocol]',
	async ({ params }: GetStaticPropsContext<{ protocol: string }>) => {
		if (!params?.protocol) {
			return { notFound: true }
		}

		const { protocol } = params
		const [{ default: metadataCache }, { resolveProtocolFeatureRouteFromMetadata }] = await Promise.all([
			import('~/utils/metadata'),
			import('~/containers/ProtocolOverview/server/routes')
		])
		const protocolRoute = resolveProtocolFeatureRouteFromMetadata({
			hasMetric: (metadata) => Boolean(metadata.governance),
			metadataCache,
			protocol,
			routePrefix: 'protocol/governance'
		})
		if (!protocolRoute) {
			return { notFound: true }
		}
		if (protocolRoute.type === 'redirect') {
			return canonicalRouteRedirect(protocolRoute.destination)
		}
		const metadata = protocolRoute.route.metadata
		const canonicalProtocol = protocolRoute.route.canonicalSlug

		const protocolData = await fetchProtocolOverviewMetrics(canonicalProtocol)
		const tokenlistSymbol = protocolData.gecko_id
			? metadataCache.tokenlist[protocolData.gecko_id]?.symbol?.toUpperCase()
			: undefined
		const symbol = tokenlistSymbol ?? (protocolData.symbol && protocolData.symbol !== '-' ? protocolData.symbol : null)
		const seoTitle = `${protocolData.name} Governance Proposals & Voting - DefiLlama`
		const seoDescription = `Track ${protocolData.name}${symbol ? ` (${symbol})` : ''} governance proposals, voting results, and on-chain participation on DefiLlama.`

		const [metrics, governanceProps] = await Promise.all([
			Promise.resolve(getProtocolMetricFlags({ protocolData, metadata })),
			getGovernanceDetailsPageData({
				governanceIDs: protocolData.governanceID ?? [],
				projectName: protocolData.name
			})
		])

		return {
			props: {
				name: protocolData.name,
				symbol,
				otherProtocols: protocolData?.otherProtocols ?? [],
				category: protocolData?.category ?? null,
				metrics,
				governanceData: governanceProps.governanceData,
				governanceTypes: governanceProps.governanceTypes,
				warningBanners: getProtocolWarningBanners(protocolData),
				seoTitle,
				seoDescription
			},
			revalidate: maxAgeForNext([22])
		}
	}
)

export const getStaticPaths = () => {
	// When this is true (in preview environments) don't
	// prerender any static pages
	// (faster builds, but slower initial page load)
	if (SKIP_BUILD_STATIC_GENERATION) {
		return {
			paths: [],
			fallback: 'blocking'
		}
	}

	return { paths: [], fallback: 'blocking' }
}

export default function Protocols(props: InferGetStaticPropsType<typeof getStaticProps>) {
	return (
		<ProtocolOverviewLayout
			name={props.name}
			category={props.category}
			otherProtocols={props.otherProtocols}
			metrics={props.metrics}
			tab="governance"
			warningBanners={props.warningBanners}
			seoTitle={props.seoTitle}
			seoDescription={props.seoDescription}
		>
			{props.governanceData?.length ? (
				<GovernanceProject
					projectName={props.name}
					governanceData={props.governanceData}
					governanceTypes={props.governanceTypes ?? []}
				/>
			) : null}
		</ProtocolOverviewLayout>
	)
}
