export const binanceCexMetadataCache = {
	cexs: [{ name: 'Binance', slug: 'binance-cex', coin: 'BNB' }],
	cexRouteIdBySlug: {
		binance: 'binance',
		'binance-cex': 'binance'
	},
	cexMetadataBySlug: {
		'binance-cex': { name: 'Binance', slug: 'binance-cex', coin: 'BNB' }
	},
	protocolMetadata: {
		binance: {
			name: 'binance-cex',
			displayName: 'Binance CEX',
			tvl: true,
			stablecoins: true,
			cex: true
		}
	}
}

export const cryptoComCexMetadataCache = {
	cexs: [
		{ name: 'Crypto.com', slug: 'crypto-com' },
		{ name: 'No Markets', slug: 'no-markets' }
	],
	cexRouteIdBySlug: {
		'crypto.com': 'crypto-com',
		'crypto-com': 'crypto-com',
		'no-markets': 'no-markets'
	},
	cexMetadataBySlug: {
		'crypto-com': { name: 'Crypto.com', slug: 'crypto-com' },
		'no-markets': { name: 'No Markets', slug: 'no-markets' }
	},
	protocolMetadata: {
		'crypto-com': {
			name: 'crypto-com',
			displayName: 'Crypto.com',
			tvl: true,
			stablecoins: true,
			cex: true
		},
		'no-markets': {
			name: 'no-markets',
			displayName: 'No Markets',
			tvl: true,
			stablecoins: true,
			cex: true
		}
	},
	chainMetadata: {},
	tokenlist: {},
	cgExchangeIdentifiers: []
}
