import { describe, expect, it } from 'vitest'
import { getChartExportIconFetchUrl } from '../chartPngExportIcon'
import { computeExportLayout } from '../chartPngExportLayout'

describe('computeExportLayout', () => {
	it('reserves legend space for a single exported metric', () => {
		const layout = computeExportLayout({
			title: 'Polymarket',
			legendItems: ['Revenue'],
			shouldShowLegend: true,
			hasIcon: true,
			expandLegend: undefined
		})

		expect(layout.hasLegend).toBe(true)
		expect(layout.legendRows).toBe(1)
		expect(layout.gridTop).toBeGreaterThan(layout.legendTop)
	})

	it('does not reserve legend space when there are no legend items', () => {
		const layout = computeExportLayout({
			title: 'Polymarket',
			legendItems: [],
			shouldShowLegend: true,
			hasIcon: true,
			expandLegend: undefined
		})

		expect(layout.hasLegend).toBe(false)
	})
})

describe('getChartExportIconFetchUrl', () => {
	it('routes protocol icons through the protocol icon API', () => {
		expect(getChartExportIconFetchUrl('https://icons.llamao.fi/icons/protocols/aave?w=48&h=48')).toBe(
			'/api/public/protocol-icon?slug=aave'
		)
	})

	it('routes chain icons through the chain icon API', () => {
		expect(getChartExportIconFetchUrl('https://icons.llamao.fi/icons/chains/rsz_ethereum?w=48&h=48')).toBe(
			'/api/public/chain-icon?slug=ethereum'
		)
	})

	it('falls back to the generic icon proxy for other allowed icon URLs', () => {
		const url = 'https://token-icons.llamao.fi/icons/tokens/gecko/ethereum?w=48&h=48'
		expect(getChartExportIconFetchUrl(url)).toBe(`/api/public/icon-proxy?url=${encodeURIComponent(url)}`)
	})
})
