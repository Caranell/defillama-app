import { getMetadataCache, type StaticParamPath } from '~/server/routeRegistry/common'
import { slug } from '~/utils'
import type { MetadataCache } from '~/utils/metadata/artifactContract'
import type { ICexItem, IProtocolMetadata } from '~/utils/metadata/types'
import { getCexMarketSlugsFromCache } from './routeData'

export type CexRoute = {
	id: string
	metadata: IProtocolMetadata
	cexMetadata?: ICexItem
	canonicalSlug: string
}

export function resolveCexParamFromMetadata(cex: string, metadataCache: MetadataCache): CexRoute | null {
	const normalizedCex = slug(cex)
	if (!normalizedCex) return null

	const cexMetadataBySlug: Record<string, ICexItem> = {}
	let requestedCexSlug = ''
	for (const cexMetadata of metadataCache.cexs) {
		if (!cexMetadata.slug) continue
		const cexSlug = slug(cexMetadata.slug)
		cexMetadataBySlug[cexSlug] = cexMetadata
		if (slug(cexMetadata.name) === normalizedCex) requestedCexSlug = cexSlug
	}

	for (const protocolId in metadataCache.protocolMetadata) {
		const metadata = metadataCache.protocolMetadata[protocolId]
		if (!metadata.cex || !metadata.name) continue
		const canonicalSlug = slug(metadata.name)
		if (
			canonicalSlug === normalizedCex ||
			canonicalSlug === requestedCexSlug ||
			slug(metadata.displayName) === normalizedCex ||
			slug(protocolId) === normalizedCex
		) {
			return {
				id: protocolId,
				metadata,
				cexMetadata: cexMetadataBySlug[canonicalSlug],
				canonicalSlug
			}
		}
	}

	return null
}

export function getCanonicalCexSlugsFromMetadata(metadataCache: MetadataCache): string[] {
	const slugs = new Set<string>()
	for (const protocolId in metadataCache.protocolMetadata) {
		const metadata = metadataCache.protocolMetadata[protocolId]
		if (!metadata.cex || !metadata.name) continue
		slugs.add(slug(metadata.name))
	}
	return [...slugs]
}

export async function getCexStaticPaths(limit = 10): Promise<Array<StaticParamPath<'cex'>>> {
	return getCanonicalCexSlugsFromMetadata(await getMetadataCache())
		.slice(0, limit)
		.map((cex) => ({ params: { cex } }))
}

export async function getCexSitemapRoutes(metadataCache: MetadataCache): Promise<string[]> {
	const routes = new Set<string>()
	const cexSlugs = getCanonicalCexSlugsFromMetadata(metadataCache)

	for (const cexSlug of cexSlugs) {
		routes.add(`cex/${cexSlug}`)
		routes.add(`cex/assets/${cexSlug}`)
		routes.add(`cex/stablecoins/${cexSlug}`)
	}

	for (const cexSlug of await getCexMarketSlugsFromCache()) {
		routes.add(`cex/markets/${resolveCexParamFromMetadata(cexSlug, metadataCache)?.canonicalSlug ?? cexSlug}`)
	}

	return [...routes]
}
