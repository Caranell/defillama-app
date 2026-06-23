import { describe, expect, it } from 'vitest'
import {
	normalizeChartPointsToMs,
	normalizeSeriesToMilliseconds,
	normalizeSeriesToSeconds,
	reconcileChartSelection
} from '../chartSeries.utils'

describe('ProtocolOverview chart series normalization', () => {
	it('keeps raw boundary normalization for seconds, milliseconds, and invalid points', () => {
		expect(
			normalizeChartPointsToMs([
				[1_700_000_100, 2],
				[1_700_000_000_000, 1],
				['bad', 3],
				[1_700_000_200, '4'],
				[1_700_000_300]
			])
		).toEqual([
			[1_700_000_000_000, 1],
			[1_700_000_100_000, 2],
			[1_700_000_200_000, 4]
		])
	})

	it('normalizes mixed second and millisecond timestamps to sorted seconds', () => {
		expect(
			normalizeSeriesToSeconds([
				[1_700_000_100_000, 2],
				[1_700_000_000, 1]
			])
		).toEqual([
			[1_700_000_000, 1],
			[1_700_000_100, 2]
		])
	})

	it('normalizes mixed second and millisecond timestamps to sorted milliseconds', () => {
		expect(
			normalizeSeriesToMilliseconds([
				[1_700_000_100, 2],
				[1_700_000_000_000, 1]
			])
		).toEqual([
			[1_700_000_000_000, 1],
			[1_700_000_100_000, 2]
		])
	})

	it('keeps an explicit empty chart selection empty', () => {
		expect(reconcileChartSelection([], ['Ethereum', 'Arbitrum'])).toEqual([])
	})

	it('repairs stale non-empty chart selections when available series change', () => {
		expect(reconcileChartSelection(['Ethereum'], ['Base', 'Arbitrum'])).toEqual(['Base', 'Arbitrum'])
		expect(reconcileChartSelection(['Ethereum', 'Base'], ['Base', 'Arbitrum'])).toEqual(['Base'])
	})
})
