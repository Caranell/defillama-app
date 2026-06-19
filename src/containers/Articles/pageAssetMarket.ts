export type PageAssetMarket = {
	geckoId: string
	symbol: string
	name: string
	image: string | null
	price: number | null
	change24h: number | null
	route: string | null
}

export type PageAssetSearchHit = {
	geckoId: string
	symbol: string
	name: string
	image: string | null
}
