import { describe, expect, it } from 'vitest'
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
