import { abbreviateNumber } from '~/utils'

const NON_MONETARY_SHARE_LABELS = new Set(['Weighted Average Shares Basic', 'Weighted Average Shares Diluted'])

export function isEquitiesShareCountLabel(label: string): boolean {
	return NON_MONETARY_SHARE_LABELS.has(label) || /shares? outstanding/i.test(label)
}

export function formatEquitiesStatementCellValue(label: string, value: number | null): string {
	return value == null
		? '-'
		: isEquitiesShareCountLabel(label)
			? (abbreviateNumber(value, 2) ?? '0')
			: (abbreviateNumber(value, 2, '$') ?? '$0')
}
