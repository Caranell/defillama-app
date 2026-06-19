import type { SortingState, VisibilityState } from '@tanstack/react-table'
import type { EquityActiveFilter } from './filters'

export function applyEquityFilterColumnVisibility({
	columnVisibility,
	filters
}: {
	columnVisibility: VisibilityState
	filters: EquityActiveFilter[]
}): VisibilityState {
	const effectiveVisibility = { ...columnVisibility, searchPriority: false }
	for (const filter of filters) {
		effectiveVisibility[filter.id] = true
	}
	return effectiveVisibility
}

function getDefaultSortingFilter(filters: EquityActiveFilter[]): EquityActiveFilter | null {
	for (let i = filters.length - 1; i >= 0; i--) {
		if (filters[i].kind !== 'categorical') return filters[i]
	}
	return null
}

function isDefaultFilterSortDescending(filter: EquityActiveFilter): boolean {
	if (filter.kind !== 'numeric') return true
	return filter.operator !== '<' && filter.operator !== '<='
}

export function getEquityFilterDefaultSorting({
	filters,
	fallbackSorting
}: {
	filters: EquityActiveFilter[]
	fallbackSorting: SortingState
}): SortingState {
	const filter = getDefaultSortingFilter(filters)
	return filter ? [{ id: filter.id, desc: isDefaultFilterSortDescending(filter) }] : fallbackSorting
}

function isSortingEqual(left: SortingState, right: SortingState): boolean {
	if (left.length !== right.length) return false
	for (let i = 0; i < left.length; i++) {
		if (left[i].id !== right[i].id || left[i].desc !== right[i].desc) return false
	}
	return true
}

export function shouldUpdateEquityFilterDefaultSorting({
	currentSorting,
	previousFilters,
	fallbackSorting
}: {
	currentSorting: SortingState
	previousFilters: EquityActiveFilter[]
	fallbackSorting: SortingState
}): boolean {
	return (
		isSortingEqual(currentSorting, fallbackSorting) ||
		isSortingEqual(currentSorting, getEquityFilterDefaultSorting({ filters: previousFilters, fallbackSorting }))
	)
}
