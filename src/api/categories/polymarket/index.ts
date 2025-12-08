import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '~/utils/async'

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com'
const EVENTS_QUERY = 'limit=200&offset=0&closed=false&order=volume24hr&ascending=false'
const isBrowser = typeof window !== 'undefined'

// Crypto-related keywords to identify crypto markets
const CRYPTO_KEYWORDS = [
	'bitcoin',
	'btc',
	'ethereum',
	'eth',
	'crypto',
	'token',
	'solana',
	'sol',
	'xrp',
	'ripple',
	'cardano',
	'ada',
	'dogecoin',
	'doge',
	'polygon',
	'matic',
	'avalanche',
	'avax',
	'chainlink',
	'link',
	'uniswap',
	'uni',
	'aave',
	'compound',
	'defi',
	'nft',
	'blockchain',
	'altcoin',
	'stablecoin',
	'usdc',
	'usdt',
	'tether',
	'binance',
	'bnb',
	'coinbase',
	'kraken',
	'ftx',
	'polkadot',
	'dot',
	'cosmos',
	'atom',
	'near',
	'arbitrum',
	'arb',
	'optimism',
	'op',
	'base',
	'sui',
	'aptos',
	'apt',
	'sei',
	'celestia',
	'tia',
	'jupiter',
	'jup',
	'raydium',
	'orca',
	'marinade',
	'lido',
	'eigenlayer',
	'restaking',
	'memecoin',
	'meme coin',
	'pepe',
	'shiba',
	'floki',
	'bonk',
	'wif'
]

export interface PolymarketEvent {
	id: string
	ticker: string | null
	slug: string
	title: string
	description: string
	startDate: string
	endDate: string | null
	image: string | null
	icon: string | null
	active: boolean
	closed: boolean
	liquidity: number
	volume: number
	volume24hr: number
	markets: PolymarketMarket[]
	tags?: { id: string; label: string; slug: string }[]
}

export interface PolymarketMarket {
	id: string
	question: string
	conditionId: string
	slug: string
	outcomePrices: string
	outcomes: string
	volume: number
	volume24hr: number
	liquidity: number
	active: boolean
	closed: boolean
	image: string | null
}

export interface ParsedPolymarketMarket {
	id: string
	eventId: string
	eventTitle: string
	eventSlug: string
	question: string
	slug: string
	outcomes: { name: string; price: number }[]
	volume: number
	volume24hr: number
	liquidity: number
	active: boolean
	closed: boolean
	image: string | null
	eventImage: string | null
}

function wordBoundaryMatch(text: string, term: string): boolean {
	if (!term) return false
	const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const regex = new RegExp(`\\b${escaped}\\b`, 'i')
	return regex.test(text)
}

function isCryptoRelated(event: PolymarketEvent, normalizedTerms: string[]): boolean {
	const textParts = [
		event.title ?? '',
		event.description ?? '',
		event.ticker ?? '',
		event.slug ?? '',
		...(event.tags?.map((t) => t.label) ?? [])
	]
	const textJoined = textParts.join(' ').toLowerCase()

	// Quick allow-list for known crypto terms
	if (CRYPTO_KEYWORDS.some((keyword) => wordBoundaryMatch(textJoined, keyword.toLowerCase()))) {
		return true
	}

	// Require a word-boundary match against provided search terms (names / tickers)
	return normalizedTerms.some((term) => term.length > 1 && wordBoundaryMatch(textJoined, term))
}

async function searchPolymarketEvents(searchTerms: string[]): Promise<ParsedPolymarketMarket[]> {
	const results: ParsedPolymarketMarket[] = []
	const seenMarketIds = new Set<string>()

	const eventsUrl = isBrowser
		? `/api/polymarket/events?${EVENTS_QUERY}`
		: `${POLYMARKET_GAMMA_API}/events?${EVENTS_QUERY}`

	// Fetch active events using the correct API format with required limit and offset
	const eventsResponse = await fetchJson(eventsUrl).catch(() => [])

	const events: PolymarketEvent[] = Array.isArray(eventsResponse) ? eventsResponse : []

	// Normalize search terms for matching
	const normalizedTerms = searchTerms.map((term) => term.toLowerCase().trim()).filter((term) => term.length > 1)

	for (const event of events) {
		// Only process crypto-related events or events that directly match the search terms
		if (!isCryptoRelated(event, normalizedTerms)) continue

		const eventTitle = event.title?.toLowerCase() || ''
		const eventDescription = event.description?.toLowerCase() || ''
		const eventTicker = event.ticker?.toLowerCase() || ''
		const eventSlug = event.slug?.toLowerCase() || ''
		const eventTags = event.tags?.map((tag) => tag.label.toLowerCase()) ?? []

		// Check if any search term matches the event
		const matchesEvent = normalizedTerms.some(
			(term) =>
				eventTitle.includes(term) ||
				eventDescription.includes(term) ||
				eventTicker.includes(term) ||
				eventSlug.includes(term) ||
				eventTags.some((tag) => tag.includes(term)) ||
				// Also match partial words for tickers like "ETH" matching "ethereum"
				(term.length >= 3 && eventTitle.split(/\s+/).some((word) => word.startsWith(term)))
		)

		if (matchesEvent && event.markets?.length > 0) {
			for (const market of event.markets) {
				if (seenMarketIds.has(market.id)) continue
				if (!market.active || market.closed) continue

				seenMarketIds.add(market.id)

				// Parse outcomes
				let outcomes: { name: string; price: number }[] = []
				try {
					const outcomeNames = JSON.parse(market.outcomes || '[]')
					const outcomePrices = JSON.parse(market.outcomePrices || '[]')
					outcomes = outcomeNames.map((name: string, idx: number) => ({
						name,
						price: parseFloat(outcomePrices[idx] || '0')
					}))
					// Show the most expensive / most probable outcomes first
					outcomes.sort((a, b) => b.price - a.price)
				} catch {
					outcomes = []
				}

				results.push({
					id: market.id,
					eventId: event.id,
					eventTitle: event.title,
					eventSlug: event.slug,
					question: market.question,
					slug: market.slug,
					outcomes,
					volume: market.volume || 0,
					volume24hr: market.volume24hr || 0,
					liquidity: market.liquidity || 0,
					active: market.active,
					closed: market.closed,
					image: market.image || event.image,
					eventImage: event.image
				})
			}
		}
	}

	// Sort by 24h volume, then total volume
	return results.sort((a, b) => b.volume24hr - a.volume24hr || b.volume - a.volume).slice(0, 10)
}

export function usePolymarketBets({
	name,
	symbol,
	chains
}: {
	name?: string | null
	symbol?: string | null
	chains?: string[] | null
}) {
	const searchTerms = buildSearchTerms({ name, symbol, chains })
	const isEnabled = searchTerms.length > 0

	return useQuery({
		queryKey: ['polymarket-bets', searchTerms.join(',')],
		queryFn: () => searchPolymarketEvents(searchTerms),
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchInterval: 5 * 60 * 1000,
		retry: 1,
		enabled: isEnabled
	})
}

function buildSearchTerms({
	name,
	symbol,
	chains
}: {
	name?: string | null
	symbol?: string | null
	chains?: string[] | null
}): string[] {
	const terms: string[] = []

	if (name) {
		terms.push(name.toLowerCase())
		// Handle common variations
		const cleanName = name.toLowerCase().replace(/\s+(protocol|finance|network|chain|swap|dex)$/i, '')
		if (cleanName !== name.toLowerCase()) {
			terms.push(cleanName)
		}
	}

	if (symbol && symbol !== '-') {
		terms.push(symbol.toLowerCase())
	}

	// Add chain names for chain overview
	if (chains && chains.length > 0) {
		for (const chain of chains.slice(0, 3)) {
			const chainLower = chain.toLowerCase()
			if (!terms.includes(chainLower)) {
				terms.push(chainLower)
			}
		}
	}

	return [...new Set(terms)].filter((term) => term.length > 1)
}
