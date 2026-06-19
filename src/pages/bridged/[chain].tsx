import type { GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import { TemporarilyDisabledPage } from '~/components/TemporarilyDisabledPage'
import { SKIP_BUILD_STATIC_GENERATION } from '~/constants'
import { BridgedTVLByChain } from '~/containers/BridgedTVL/BridgedTVLByChain'
import { getBridgedTVLByChain } from '~/containers/BridgedTVL/queries'
import Layout from '~/layout'
import { maxAgeForNext } from '~/utils/maxAgeForNext'
import { withPerformanceLogging } from '~/utils/perf'
import { canonicalRouteRedirect } from '~/utils/route'

export const getStaticProps = withPerformanceLogging(
	'bridged/[chain]',
	async ({ params }: GetStaticPropsContext<{ chain: string }>) => {
		if (!params?.chain) {
			return { notFound: true }
		}

		const { chain } = params
		const [{ default: metadataCache }, { getChainRouteRedirectDestination, resolveChainFeatureParamFromMetadata }] =
			await Promise.all([import('~/utils/metadata'), import('~/containers/ChainOverview/server/routes')])
		const chainRoute = resolveChainFeatureParamFromMetadata(chain, metadataCache, (metadata) =>
			Boolean(metadata.chainAssets)
		)
		if (!chainRoute) {
			return { notFound: true }
		}
		const redirectDestination = getChainRouteRedirectDestination(chain, chainRoute, 'bridged')
		if (redirectDestination) {
			return canonicalRouteRedirect(redirectDestination)
		}

		const data = await getBridgedTVLByChain({
			chain: chainRoute.canonicalName,
			chainMetadata: metadataCache.chainMetadata
		})

		return {
			props: { ...data, chain: chainRoute.canonicalSlug, chainName: chainRoute.canonicalName },
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

const pageName = ['Bridged TVL', 'by', 'Chain']

export default function Bridged(props: InferGetStaticPropsType<typeof getStaticProps>) {
	if (!props.chainData) {
		return (
			<TemporarilyDisabledPage
				title={`${props.chainName} Bridged Assets & Cross-Chain TVL - DefiLlama`}
				description={`Track total value of assets bridged to ${props.chainName} from other chains. View bridged TVL breakdown by token, source chain, and bridge protocol. Real-time cross-chain asset analytics for ${props.chainName}.`}
				canonicalUrl={`/bridged/${props.chain}`}
				heading="Bridged TVL temporarily unavailable"
			>
				<p>We recognize this route, but the upstream bridge APIs failed while loading this page.</p>
				<p>Please try again in a few minutes.</p>
			</TemporarilyDisabledPage>
		)
	}

	return (
		<Layout
			title={`${props.chainName} Bridged Assets & Cross-Chain TVL - DefiLlama`}
			description={`Track total value of assets bridged to ${props.chainName} from other chains. View bridged TVL breakdown by token, source chain, and bridge protocol. Real-time cross-chain asset analytics for ${props.chainName}.`}
			canonicalUrl={`/bridged/${props.chain}`}
			pageName={pageName}
		>
			<BridgedTVLByChain {...props} />
		</Layout>
	)
}
