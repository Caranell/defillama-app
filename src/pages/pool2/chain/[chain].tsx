import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import { SKIP_BUILD_STATIC_GENERATION } from '~/constants'
import { ExtraTvlByChain } from '~/containers/ProtocolLists/ExtraTvlByChain'
import { getExtraTvlByChain } from '~/containers/ProtocolLists/queries'
import Layout from '~/layout'
import { slug } from '~/utils'
import { maxAgeForNext } from '~/utils/maxAgeForNext'
import { withPerformanceLogging } from '~/utils/perf'
import { canonicalRouteRedirect } from '~/utils/route'

export const getStaticPaths = () => {
	if (SKIP_BUILD_STATIC_GENERATION) {
		return {
			paths: [],
			fallback: 'blocking'
		}
	}

	return { paths: [], fallback: 'blocking' }
}

export const getStaticProps = withPerformanceLogging(
	`pool2/chain/[chain]`,
	async ({ params }: GetStaticPropsContext<{ chain: string }>) => {
		const chain = slug(params.chain)
		const [{ default: metadataCache }, { getChainRouteRedirectDestination, resolveChainParamFromMetadata }] =
			await Promise.all([import('~/utils/metadata'), import('~/containers/ChainOverview/server/routes')])
		const chainRoute = resolveChainParamFromMetadata(params.chain, metadataCache)
		if (!chainRoute) {
			return { notFound: true }
		}
		const redirectDestination = getChainRouteRedirectDestination(params.chain, chainRoute, 'pool2/chain')
		if (redirectDestination) {
			return canonicalRouteRedirect(redirectDestination)
		}

		const data = await getExtraTvlByChain({
			chain: chainRoute.canonicalName,
			metric: 'pool2',
			protocolMetadata: metadataCache.protocolMetadata
		})

		if (!data) throw new Error(`Missing page data for route=/pool2/chain/[chain] chain=${chain}`)

		return {
			props: data,
			revalidate: maxAgeForNext([22])
		}
	}
)

const pageName = ['Protocols', 'ranked by', 'Pool2 TVL']

export default function Pool2TVLByChain(props: InferGetStaticPropsType<typeof getStaticProps>) {
	return (
		<Layout
			title={`${props.chain} Pool2 TVL Metrics - DefiLlama`}
			description={`Track Pool2 TVL across DeFi protocols on ${props.chain}. Compare value locked in liquidity and staking pools on DefiLlama.`}
			canonicalUrl={`/pool2/chain/${slug(props.chain)}`}
			pageName={pageName}
		>
			<ExtraTvlByChain {...props} />
		</Layout>
	)
}
