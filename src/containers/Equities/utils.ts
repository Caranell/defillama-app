const equitiesDateFormatter = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
})

const equitiesDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	timeZoneName: 'short'
})

interface IEquityTickerCountry {
	ticker: string
	country: string
}

export function buildEquityTickerCountrySlug(ticker: string, country: string): string {
	return `${ticker}:${country}`
}

export function parseEquityTickerCountrySlug(slug: string): IEquityTickerCountry | null {
	const parts = slug.split(':')
	if (parts.length !== 2) return null

	const [ticker, country] = parts
	return ticker && country ? { ticker, country } : null
}

export function parseEquityTickerCountryParam(param: string): IEquityTickerCountry | null {
	const tickerCountry = parseEquityTickerCountrySlug(param)
	if (tickerCountry) return tickerCountry

	return param ? { ticker: param, country: 'US' } : null
}

export function formatEquitiesDate(value?: string | null): string {
	if (!value) return '-'
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!match) return value
	const [, year, month, day] = match
	return equitiesDateFormatter.format(Date.UTC(Number(year), Number(month) - 1, Number(day)))
}

export function formatEquitiesDateTime(value?: string | null): string {
	if (!value) return '-'
	const parsed = Date.parse(value)
	return Number.isNaN(parsed) ? value : equitiesDateTimeFormatter.format(parsed)
}
