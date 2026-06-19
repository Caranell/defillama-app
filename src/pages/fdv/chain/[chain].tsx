import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import { SKIP_BUILD_STATIC_GENERATION } from '~/constants'
import { ProtocolsWithTokens } from '~/containers/ProtocolLists/ProtocolsWithTokens'
import { getProtocolsFDVsByChain } from '~/containers/ProtocolLists/queries'
import Layout from '~/layout'
import { slug } from '~/utils'
import { maxAgeForNext } from '~/utils/maxAgeForNext'
import { withPerformanceLogging } from '~/utils/perf'
import { canonicalRouteRedirect } from '~/utils/route'

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

export const getStaticProps = withPerformanceLogging(
	`protocols-fdv/chain/[chain]`,
	async ({ params }: GetStaticPropsContext<{ chain: string }>) => {
		const chain = slug(params.chain)
		const [{ default: metadataCache }, { getChainRouteRedirectDestination, resolveChainParamFromMetadata }] =
			await Promise.all([import('~/utils/metadata'), import('~/containers/ChainOverview/server/routes')])
		const chainRoute = resolveChainParamFromMetadata(params.chain, metadataCache)
		if (!chainRoute) {
			return { notFound: true }
		}
		const redirectDestination = getChainRouteRedirectDestination(params.chain, chainRoute, 'fdv/chain')
		if (redirectDestination) {
			return canonicalRouteRedirect(redirectDestination)
		}

		const data = await getProtocolsFDVsByChain({
			chain: chainRoute.canonicalName,
			protocolMetadata: metadataCache.protocolMetadata
		})

		if (!data) throw new Error(`Missing page data for route=/fdv/chain/[chain] chain=${chain}`)

		return {
			props: data,
			revalidate: maxAgeForNext([22])
		}
	}
)

const pageName = ['Protocols', 'ranked by', 'Fully Diluted Valuation']

export default function ProtocolsFdvByChain(props: InferGetStaticPropsType<typeof getStaticProps>) {
	return (
		<Layout
			title={`${props.chain} FDV Rankings - Fully Diluted Valuation - DefiLlama`}
			description={`Track DeFi protocol FDV rankings on ${props.chain}. Compare fully diluted valuations for all protocols in the ${props.chain} ecosystem. Real-time ${props.chain} crypto FDV analytics and token valuation data.`}
			canonicalUrl={`/fdv/chain/${slug(props.chain)}`}
			pageName={pageName}
		>
			<ProtocolsWithTokens {...props} />
		</Layout>
	)
}
