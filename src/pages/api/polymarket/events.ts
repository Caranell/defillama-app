import type { NextApiRequest, NextApiResponse } from 'next'

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com'

const DEFAULT_QUERY = {
	limit: '200',
	offset: '0',
	closed: 'false',
	order: 'volume24hr',
	ascending: 'false'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', ['GET'])
		return res.status(405).json({ error: 'Method Not Allowed' })
	}

	const { limit, offset, closed, order, ascending } = req.query

	const params = new URLSearchParams({
		...DEFAULT_QUERY,
		...(limit ? { limit: String(limit) } : {}),
		...(offset ? { offset: String(offset) } : {}),
		...(closed ? { closed: String(closed) } : {}),
		...(order ? { order: String(order) } : {}),
		...(ascending ? { ascending: String(ascending) } : {})
	})

	const url = `${POLYMARKET_GAMMA_API}/events?${params.toString()}`

	try {
		const response = await fetch(url)
		if (!response.ok) {
			return res.status(response.status).json({ error: 'Upstream error', status: response.status })
		}

		const data = await response.json()
		// Proxy transparently
		res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60')
		return res.status(200).json(data)
	} catch (error) {
		return res.status(500).json({ error: 'Failed to fetch Polymarket events' })
	}
}

