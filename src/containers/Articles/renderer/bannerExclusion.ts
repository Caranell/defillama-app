import type { Banner } from '~/containers/Articles/types'

export function allArticlesBannerForArticle(
	banner: Banner | null,
	articleId: string | null | undefined
): Banner | null {
	if (!banner) return null
	if (articleId && banner.excludedArticleIds?.includes(articleId)) return null
	return banner
}
