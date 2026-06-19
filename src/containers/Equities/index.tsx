import {
	type ColumnDef,
	type ColumnFiltersState,
	createColumnHelper,
	functionalUpdate,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	type VisibilityState,
	useReactTable
} from '@tanstack/react-table'
import { useRouter } from 'next/router'
import { startTransition, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { CSVDownloadButton } from '~/components/ButtonStyled/CsvButton'
import { Icon } from '~/components/Icon'
import { BasicLink } from '~/components/Link'
import { SelectWithCombobox } from '~/components/Select/SelectWithCombobox'
import { PaginatedTable, usePaginatedTableDisplayRowNumber } from '~/components/Table/PaginatedTable'
import { prepareTableCsv } from '~/components/Table/utils'
import { TokenLogo } from '~/components/TokenLogo'
import defs from '~/public/equities-definitions.json'
import { abbreviateNumber } from '~/utils'
import { equityCountryFlagUrl } from '~/utils/icons'
import { readSingleQueryValue, pushShallowQuery } from '~/utils/routerQuery'
import type { IEquitiesListCompanyRow, IEquitiesListPageProps } from './types'
import { formatEquitiesDateTime } from './utils'

type EquitiesTableCompanyRow = IEquitiesListCompanyRow & { searchPriority?: number }

const columnHelper = createColumnHelper<EquitiesTableCompanyRow>()
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 50

function formatNumber(value: unknown, symbol?: string): string {
	return abbreviateNumber(value, 2, symbol) ?? '-'
}

function ChangePercent({ value }: { value: number | null }) {
	return (
		<span className={value == null || value === 0 ? undefined : value > 0 ? 'text-(--success)' : 'text-(--error)'}>
			{formatNumber(value, '%')}
		</span>
	)
}

function ChangeValue({ value, symbol }: { value: number | null; symbol?: string }) {
	return (
		<span className={value == null || value === 0 ? undefined : value > 0 ? 'text-(--success)' : 'text-(--error)'}>
			{formatNumber(value, symbol)}
		</span>
	)
}

function EquityTickerCell({ row }: { row: { id: string; original: EquitiesTableCompanyRow } }) {
	const rowIndex = usePaginatedTableDisplayRowNumber(row.id)

	return (
		<span className="flex min-w-0 items-center gap-2">
			<span className="inline-block min-w-4 shrink-0 text-left text-(--text-secondary) tabular-nums" aria-hidden="true">
				{rowIndex}
			</span>
			<TokenLogo
				kind="equities"
				name={row.original.ticker}
				country={row.original.country}
				data-lgonly
				alt={`Logo of ${row.original.ticker}`}
			/>
			<BasicLink href={row.original.href} className="font-medium text-(--link-text)">
				{row.original.ticker}
			</BasicLink>
		</span>
	)
}

const columns: ColumnDef<EquitiesTableCompanyRow>[] = [
	columnHelper.accessor((row) => row.searchPriority ?? 0, {
		id: 'searchPriority',
		header: 'Search Priority',
		meta: {
			hidden: true,
			headerClassName: 'w-[0px] min-w-[0px]'
		}
	}),
	columnHelper.accessor('ticker', {
		header: 'Ticker',
		enableSorting: false,
		cell: ({ row }) => <EquityTickerCell row={row} />,
		meta: {
			headerClassName: 'w-[128px] min-w-[128px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('country', {
		header: 'Country',
		enableSorting: false,
		cell: ({ getValue }) => (
			<span className="flex items-center gap-2">
				<img
					src={equityCountryFlagUrl(getValue())}
					alt={`${getValue()} flag`}
					className="h-6 w-6 rounded-full object-contain"
					height={24}
					width={24}
				/>
				<span>{getValue()}</span>
			</span>
		),
		meta: {
			headerClassName: 'w-[88px] min-w-[88px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('marketCap', {
		header: defs.marketCap.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[124px] min-w-[124px]',
			align: 'end',
			headerHelperText: defs.marketCap.description
		}
	}),
	columnHelper.accessor('name', {
		header: 'Company',
		enableSorting: false,
		cell: ({ getValue, row }) => (
			<BasicLink href={row.original.href} className="text-(--link-text)">
				{getValue()}
			</BasicLink>
		),
		meta: {
			headerClassName: 'w-[180px] min-w-[180px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('sector', {
		header: 'Sector',
		enableSorting: false,
		meta: {
			headerClassName: 'w-[136px] min-w-[136px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('industry', {
		header: 'Industry',
		enableSorting: false,
		meta: {
			headerClassName: 'w-[160px] min-w-[160px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('currentPrice', {
		header: defs.currentPrice.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[104px] min-w-[104px]',
			align: 'end',
			headerHelperText: defs.currentPrice.description
		}
	}),
	columnHelper.accessor('priceChangePercentage1d', {
		header: defs.priceChangePercentage1d.label,
		cell: ({ getValue }) => <ChangePercent value={getValue()} />,
		meta: {
			headerClassName: 'w-[168px] min-w-[168px]',
			align: 'end',
			headerHelperText: defs.priceChangePercentage1d.description
		}
	}),
	columnHelper.accessor('priceChangePercentage7d', {
		header: defs.priceChangePercentage7d.label,
		cell: ({ getValue }) => <ChangePercent value={getValue()} />,
		meta: {
			headerClassName: 'w-[168px] min-w-[168px]',
			align: 'end',
			headerHelperText: defs.priceChangePercentage7d.description
		}
	}),
	columnHelper.accessor('priceChangePercentage1m', {
		header: defs.priceChangePercentage1m.label,
		cell: ({ getValue }) => <ChangePercent value={getValue()} />,
		meta: {
			headerClassName: 'w-[168px] min-w-[168px]',
			align: 'end',
			headerHelperText: defs.priceChangePercentage1m.description
		}
	}),
	columnHelper.accessor('volume', {
		header: defs.volume.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[104px] min-w-[104px]',
			align: 'end',
			headerHelperText: defs.volume.description
		}
	}),
	columnHelper.accessor('marketCapChange1d', {
		header: defs.marketCapChange1d.label,
		cell: ({ getValue }) => <ChangeValue value={getValue()} symbol="$" />,
		meta: {
			headerClassName: 'w-[200px] min-w-[200px]',
			align: 'end',
			headerHelperText: defs.marketCapChange1d.description
		}
	}),
	columnHelper.accessor('circulatingMarketCap', {
		header: defs.circulatingMarketCap.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[172px] min-w-[172px]',
			align: 'end',
			headerHelperText: defs.circulatingMarketCap.description
		}
	}),
	columnHelper.accessor('enterpriseValue', {
		header: defs.enterpriseValue.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[172px] min-w-[172px]',
			align: 'end',
			headerHelperText: defs.enterpriseValue.description
		}
	}),
	columnHelper.accessor('trailingPE', {
		header: defs.trailingPE.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[80px] min-w-[80px]',
			align: 'end',
			headerHelperText: defs.trailingPE.description
		}
	}),
	columnHelper.accessor('priceToRevenue', {
		header: defs.priceToRevenue.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[72px] min-w-[72px]',
			align: 'end',
			headerHelperText: defs.priceToRevenue.description
		}
	}),
	columnHelper.accessor('dividendYield', {
		header: defs.dividendYield.label,
		cell: ({ getValue }) => formatNumber(getValue(), '%'),
		meta: {
			headerClassName: 'w-[160px] min-w-[160px]',
			align: 'end',
			headerHelperText: defs.dividendYield.description
		}
	}),
	columnHelper.accessor('holdersYield', {
		header: defs.holdersYield.label,
		cell: ({ getValue }) => formatNumber(getValue(), '%'),
		meta: {
			headerClassName: 'w-[148px] min-w-[148px]',
			align: 'end',
			headerHelperText: defs.holdersYield.description
		}
	}),
	columnHelper.accessor('priceToBook', {
		header: defs.priceToBook.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[80px] min-w-[80px]',
			align: 'end',
			headerHelperText: defs.priceToBook.description
		}
	}),
	columnHelper.accessor('enterpriseValueToEbitda', {
		header: defs.enterpriseValueToEbitda.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[124px] min-w-[124px]',
			align: 'end',
			headerHelperText: defs.enterpriseValueToEbitda.description
		}
	}),
	columnHelper.accessor('operatingProfitMarginTTM', {
		header: defs.operatingProfitMarginTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '%'),
		meta: {
			headerClassName: 'w-[164px] min-w-[164px]',
			align: 'end',
			headerHelperText: defs.operatingProfitMarginTTM.description
		}
	}),
	columnHelper.accessor('revenueTTM', {
		header: defs.revenueTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[144px] min-w-[144px]',
			align: 'end',
			headerHelperText: defs.revenueTTM.description
		}
	}),
	columnHelper.accessor('grossProfitTTM', {
		header: defs.grossProfitTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[172px] min-w-[172px]',
			align: 'end',
			headerHelperText: defs.grossProfitTTM.description
		}
	}),
	columnHelper.accessor('earningsTTM', {
		header: defs.earningsTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[160px] min-w-[160px]',
			align: 'end',
			headerHelperText: defs.earningsTTM.description
		}
	}),
	columnHelper.accessor('ebitdaTTM', {
		header: defs.ebitdaTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[152px] min-w-[152px]',
			align: 'end',
			headerHelperText: defs.ebitdaTTM.description
		}
	}),
	columnHelper.accessor('holdersRevenueTTM', {
		header: defs.holdersRevenueTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[212px] min-w-[212px]',
			align: 'end',
			headerHelperText: defs.holdersRevenueTTM.description
		}
	}),
	columnHelper.accessor('holderEarningsTTM', {
		header: defs.holderEarningsTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[220px] min-w-[220px]',
			align: 'end',
			headerHelperText: defs.holderEarningsTTM.description
		}
	}),
	columnHelper.accessor('dividendsTTM', {
		header: defs.dividendsTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[156px] min-w-[156px]',
			align: 'end',
			headerHelperText: defs.dividendsTTM.description
		}
	}),
	columnHelper.accessor('stockRepurchaseTTM', {
		header: defs.stockRepurchaseTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[156px] min-w-[156px]',
			align: 'end',
			headerHelperText: defs.stockRepurchaseTTM.description
		}
	}),
	columnHelper.accessor('stockIssuanceTTM', {
		header: defs.stockIssuanceTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[204px] min-w-[204px]',
			align: 'end',
			headerHelperText: defs.stockIssuanceTTM.description
		}
	}),
	columnHelper.accessor('stockBasedCompensationTTM', {
		header: defs.stockBasedCompensationTTM.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[176px] min-w-[176px]',
			align: 'end',
			headerHelperText: defs.stockBasedCompensationTTM.description
		}
	}),
	columnHelper.accessor('cashAndCashEquivalents', {
		header: defs.cashAndCashEquivalents.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[144px] min-w-[144px]',
			align: 'end',
			headerHelperText: defs.cashAndCashEquivalents.description
		}
	}),
	columnHelper.accessor('totalAssets', {
		header: defs.totalAssets.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[140px] min-w-[140px]',
			align: 'end',
			headerHelperText: defs.totalAssets.description
		}
	}),
	columnHelper.accessor('totalLiabilities', {
		header: defs.totalLiabilities.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[172px] min-w-[172px]',
			align: 'end',
			headerHelperText: defs.totalLiabilities.description
		}
	}),
	columnHelper.accessor('totalShareholdersEquity', {
		header: defs.totalShareholdersEquity.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[124px] min-w-[124px]',
			align: 'end',
			headerHelperText: defs.totalShareholdersEquity.description
		}
	}),
	columnHelper.accessor('totalDebt', {
		header: defs.totalDebt.label,
		cell: ({ getValue }) => formatNumber(getValue(), '$'),
		meta: {
			headerClassName: 'w-[124px] min-w-[124px]',
			align: 'end',
			headerHelperText: defs.totalDebt.description
		}
	}),
	columnHelper.accessor('circulatingSupply', {
		header: defs.circulatingSupply.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[132px] min-w-[132px]',
			align: 'end',
			headerHelperText: defs.circulatingSupply.description
		}
	}),
	columnHelper.accessor('totalSupply', {
		header: defs.totalSupply.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[140px] min-w-[140px]',
			align: 'end',
			headerHelperText: defs.totalSupply.description
		}
	}),
	columnHelper.accessor('employeeCount', {
		header: defs.employeeCount.label,
		cell: ({ getValue }) => formatNumber(getValue()),
		meta: {
			headerClassName: 'w-[124px] min-w-[124px]',
			align: 'end',
			headerHelperText: defs.employeeCount.description
		}
	})
]

const EQUITIES_PRIMARY_PRESETS = [
	'Market Cap',
	'Earnings',
	'Revenue',
	'Employees',
	'P/E ratio',
	'Dividend %',
	'Market Cap gain',
	'Market Cap loss',
	'Operating Margin'
] as const

const EQUITIES_MORE_PRESETS = [
	'Holder Yield',
	'Enterprise Value',
	'Total assets',
	'Total liabilities',
	'Net Assets',
	'Total debt',
	'Cash on hand',
	'Price to Book'
] as const

const EQUITIES_PRESETS = [...EQUITIES_PRIMARY_PRESETS, ...EQUITIES_MORE_PRESETS] as const

type EquitiesPreset = (typeof EQUITIES_PRESETS)[number]

const PRESET_QUERY_SLUGS: Record<EquitiesPreset, string | undefined> = {
	'Market Cap': undefined,
	Earnings: 'earnings',
	Revenue: 'revenue',
	Employees: 'employees',
	'P/E ratio': 'pe-ratio',
	'Dividend %': 'dividend',
	'Market Cap gain': 'market-cap-gain',
	'Market Cap loss': 'market-cap-loss',
	'Operating Margin': 'operating-margin',
	'Holder Yield': 'holder-yield',
	'Enterprise Value': 'enterprise-value',
	'Total assets': 'total-assets',
	'Total liabilities': 'total-liabilities',
	'Net Assets': 'net-assets',
	'Total debt': 'total-debt',
	'Cash on hand': 'cash-on-hand',
	'Price to Book': 'price-to-book'
}

const DATA_COLUMN_IDS = [
	'country',
	'sector',
	'industry',
	'currentPrice',
	'priceChangePercentage1d',
	'priceChangePercentage7d',
	'priceChangePercentage1m',
	'volume',
	'marketCap',
	'marketCapChange1d',
	'circulatingMarketCap',
	'enterpriseValue',
	'trailingPE',
	'priceToRevenue',
	'dividendYield',
	'holdersYield',
	'priceToBook',
	'enterpriseValueToEbitda',
	'operatingProfitMarginTTM',
	'revenueTTM',
	'grossProfitTTM',
	'earningsTTM',
	'ebitdaTTM',
	'holdersRevenueTTM',
	'holderEarningsTTM',
	'dividendsTTM',
	'stockRepurchaseTTM',
	'stockIssuanceTTM',
	'stockBasedCompensationTTM',
	'cashAndCashEquivalents',
	'totalAssets',
	'totalLiabilities',
	'totalShareholdersEquity',
	'totalDebt',
	'circulatingSupply',
	'totalSupply',
	'employeeCount'
] as const

const PRESET_VISIBLE_COLUMNS: Record<EquitiesPreset, readonly string[]> = {
	'Market Cap': [
		'country',
		'marketCap',
		'currentPrice',
		'priceChangePercentage1d',
		'priceChangePercentage7d',
		'priceChangePercentage1m',
		'volume'
	],
	Employees: ['country', 'employeeCount', 'marketCap', 'revenueTTM', 'currentPrice'],
	Earnings: [
		'country',
		'earningsTTM',
		'ebitdaTTM',
		'holderEarningsTTM',
		'trailingPE',
		'enterpriseValueToEbitda',
		'marketCap'
	],
	Revenue: [
		'country',
		'revenueTTM',
		'grossProfitTTM',
		'holdersRevenueTTM',
		'priceToRevenue',
		'operatingProfitMarginTTM',
		'marketCap'
	],
	'P/E ratio': ['country', 'trailingPE', 'currentPrice', 'earningsTTM', 'marketCap', 'priceToBook'],
	'Dividend %': ['country', 'dividendYield', 'currentPrice', 'marketCap', 'trailingPE'],
	'Market Cap gain': ['country', 'marketCapChange1d', 'marketCap', 'priceChangePercentage1d', 'currentPrice', 'volume'],
	'Market Cap loss': ['country', 'marketCapChange1d', 'marketCap', 'priceChangePercentage1d', 'currentPrice', 'volume'],
	'Holder Yield': ['country', 'holdersYield', 'dividendsTTM', 'stockRepurchaseTTM', 'stockIssuanceTTM', 'marketCap'],
	'Operating Margin': [
		'country',
		'operatingProfitMarginTTM',
		'revenueTTM',
		'grossProfitTTM',
		'earningsTTM',
		'marketCap'
	],
	'Enterprise Value': [
		'country',
		'enterpriseValue',
		'enterpriseValueToEbitda',
		'ebitdaTTM',
		'totalDebt',
		'cashAndCashEquivalents',
		'marketCap'
	],
	'Total assets': ['country', 'totalAssets', 'totalLiabilities', 'totalDebt', 'marketCap', 'currentPrice'],
	'Total liabilities': [
		'country',
		'totalLiabilities',
		'totalAssets',
		'totalShareholdersEquity',
		'totalDebt',
		'marketCap',
		'currentPrice'
	],
	'Net Assets': ['country', 'totalShareholdersEquity', 'totalAssets', 'totalLiabilities', 'totalDebt', 'marketCap'],
	'Total debt': ['country', 'totalDebt', 'totalLiabilities', 'totalAssets', 'cashAndCashEquivalents', 'marketCap'],
	'Cash on hand': ['country', 'cashAndCashEquivalents', 'totalDebt', 'totalLiabilities', 'totalAssets', 'marketCap'],
	'Price to Book': ['country', 'priceToBook', 'currentPrice', 'marketCap', 'totalAssets']
}

const PRESET_SORTING: Record<EquitiesPreset, SortingState> = {
	'Market Cap': [{ id: 'marketCap', desc: true }],
	Earnings: [{ id: 'earningsTTM', desc: true }],
	Revenue: [{ id: 'revenueTTM', desc: true }],
	Employees: [{ id: 'employeeCount', desc: true }],
	'P/E ratio': [{ id: 'trailingPE', desc: true }],
	'Dividend %': [{ id: 'dividendYield', desc: true }],
	'Market Cap gain': [{ id: 'marketCapChange1d', desc: true }],
	'Market Cap loss': [{ id: 'marketCapChange1d', desc: false }],
	'Holder Yield': [{ id: 'holdersYield', desc: true }],
	'Operating Margin': [{ id: 'operatingProfitMarginTTM', desc: true }],
	'Enterprise Value': [{ id: 'enterpriseValue', desc: true }],
	'Total assets': [{ id: 'totalAssets', desc: true }],
	'Total liabilities': [{ id: 'totalLiabilities', desc: true }],
	'Net Assets': [{ id: 'totalShareholdersEquity', desc: true }],
	'Total debt': [{ id: 'totalDebt', desc: true }],
	'Cash on hand': [{ id: 'cashAndCashEquivalents', desc: true }],
	'Price to Book': [{ id: 'priceToBook', desc: true }]
}

function getPresetFromQuery(value?: string): EquitiesPreset {
	if (!value) return 'Market Cap'
	const match = EQUITIES_PRESETS.find((p) => PRESET_QUERY_SLUGS[p] === value)
	return match ?? 'Market Cap'
}

function buildPresetVisibility(preset: EquitiesPreset): VisibilityState {
	const visible = new Set(PRESET_VISIBLE_COLUMNS[preset])
	const visibility: VisibilityState = { name: false, searchPriority: false }
	for (const id of DATA_COLUMN_IDS) {
		visibility[id] = visible.has(id)
	}
	return visibility
}

function getUniqueValues(companies: IEquitiesListCompanyRow[], key: 'country' | 'sector' | 'industry'): string[] {
	const values = new Set<string>()
	for (const company of companies) {
		if (company[key]) values.add(company[key])
	}
	return Array.from(values).sort((a, b) => a.localeCompare(b))
}

type EquitiesTableState = {
	columnFilters: ColumnFiltersState
	sorting: SortingState
	columnVisibility: VisibilityState
	pagination: PaginationState
	searchValue: string
}

function buildInitialTableState(preset: EquitiesPreset): EquitiesTableState {
	return {
		columnFilters: [],
		sorting: PRESET_SORTING[preset],
		columnVisibility: buildPresetVisibility(preset),
		pagination: { pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE },
		searchValue: ''
	}
}

function EquitiesRankingsTable({
	preset,
	companies
}: {
	preset: EquitiesPreset
	companies: IEquitiesListCompanyRow[]
}) {
	const industryOptions = useMemo(() => getUniqueValues(companies, 'industry'), [companies])
	const [selectedIndustries, setSelectedIndustries] = useState(industryOptions)
	const [tableState, setTableState] = useState(() => buildInitialTableState(preset))
	const { columnFilters, sorting, columnVisibility, pagination, searchValue } = tableState
	const deferredSearchValue = useDeferredValue(searchValue)
	const searchQuery = deferredSearchValue.trim()

	const filteredCompanies = useMemo(() => {
		if (selectedIndustries.length === 0) return []

		const industries = new Set(selectedIndustries)
		const normalizedSearchQuery = searchQuery.toLowerCase()
		if (normalizedSearchQuery) {
			const tickerMatches: EquitiesTableCompanyRow[] = []
			const companyMatches: EquitiesTableCompanyRow[] = []

			for (const company of companies) {
				if (!industries.has(company.industry)) continue
				if (company.ticker.toLowerCase().includes(normalizedSearchQuery)) {
					tickerMatches.push({ ...company, searchPriority: 0 })
				} else if (company.name.toLowerCase().includes(normalizedSearchQuery)) {
					companyMatches.push({ ...company, searchPriority: 1 })
				}
			}

			return tickerMatches.concat(companyMatches)
		}

		const filtered: EquitiesTableCompanyRow[] = []

		for (const company of companies) {
			if (!industries.has(company.industry)) continue
			filtered.push(company)
		}

		return filtered
	}, [companies, selectedIndustries, searchQuery])
	const tableSorting = searchQuery
		? [{ id: 'searchPriority', desc: false }, ...sorting.filter((sort) => sort.id !== 'searchPriority')]
		: sorting
	const tableColumnVisibility = useMemo(() => ({ ...columnVisibility, searchPriority: false }), [columnVisibility])

	const table = useReactTable({
		data: filteredCompanies,
		columns,
		state: {
			sorting: tableSorting,
			columnFilters,
			columnVisibility: tableColumnVisibility,
			pagination
		},
		defaultColumn: {
			sortUndefined: 'last'
		},
		enableSortingRemoval: false,
		onSortingChange: (updater) =>
			startTransition(() =>
				setTableState((state) => ({ ...state, sorting: functionalUpdate(updater, state.sorting) }))
			),
		onColumnFiltersChange: (updater) =>
			startTransition(() =>
				setTableState((state) => ({
					...state,
					columnFilters: functionalUpdate(updater, state.columnFilters)
				}))
			),
		onColumnVisibilityChange: (updater) =>
			startTransition(() =>
				setTableState((state) => ({
					...state,
					columnVisibility: functionalUpdate(updater, state.columnVisibility)
				}))
			),
		onPaginationChange: (updater) =>
			startTransition(() =>
				setTableState((state) => ({ ...state, pagination: functionalUpdate(updater, state.pagination) }))
			),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	})

	const columnOptions = useMemo(() => {
		const options: Array<{ key: string; name: string; help?: string }> = []
		for (const column of columns) {
			if (column.meta?.hidden) continue
			const key = column.id ?? ('accessorKey' in column ? String(column.accessorKey) : '')
			if (!key) continue
			const name = typeof column.header === 'function' ? key : column.header != null ? String(column.header) : key
			const help = column.meta?.headerHelperText ?? undefined
			options.push({ key, name, help })
		}
		return options
	}, [])

	const selectedColumns: string[] = []
	for (const column of table.getAllLeafColumns()) {
		if (column.getIsVisible()) selectedColumns.push(column.id)
	}

	const setColumnOptions = (newOptions: string[] | ((prev: string[]) => string[])) => {
		const resolvedOptions = typeof newOptions === 'function' ? newOptions(selectedColumns) : newOptions
		const nextVisibility: VisibilityState = {}
		for (const column of table.getAllLeafColumns()) {
			nextVisibility[column.id] = resolvedOptions.includes(column.id)
		}
		table.setColumnVisibility(nextVisibility)
	}

	const setSearchValue = (value: string) => {
		setTableState((state) => ({ ...state, searchValue: value }))
	}

	return (
		<div className="flex flex-col gap-3 rounded-md border border-(--cards-border) bg-(--cards-bg) p-3">
			<div className="flex w-full flex-wrap items-center justify-end gap-3">
				<h2 className="mr-auto text-lg font-semibold">Company Rankings</h2>
				<label className="relative w-full max-w-full min-w-[280px] sm:max-w-[280px]">
					<span className="sr-only">Search companies or tickers</span>
					<Icon
						name="search"
						height={16}
						width={16}
						className="absolute top-0 bottom-0 left-2 my-auto text-(--text-tertiary)"
					/>
					<input
						onInput={(event) => setSearchValue(event.currentTarget.value)}
						placeholder="Search companies or tickers"
						className="w-full rounded-md border border-(--form-control-border) bg-white p-1 pl-7 text-black dark:bg-black dark:text-white"
					/>
				</label>
				<SelectWithCombobox
					allValues={columnOptions}
					selectedValues={selectedColumns}
					setSelectedValues={setColumnOptions}
					nestedMenu={false}
					label="Columns"
					labelType="smol"
					variant="filter-responsive"
				/>
				<SelectWithCombobox
					allValues={industryOptions}
					selectedValues={selectedIndustries}
					setSelectedValues={setSelectedIndustries}
					nestedMenu={false}
					label="Industry"
					labelType="smol"
					variant="filter-responsive"
				/>
				<CSVDownloadButton
					prepareCsv={() => prepareTableCsv({ instance: table, filename: 'equities-rankings' })}
					smol
				/>
			</div>
			<PaginatedTable table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} tableClassName="min-w-max!" />
		</div>
	)
}

export function EquitiesOverview({ companies, updatedAt }: IEquitiesListPageProps) {
	const router = useRouter()
	const selectedPreset = useMemo(
		() => getPresetFromQuery(readSingleQueryValue(router.query.rankBy)),
		[router.query.rankBy]
	)
	const [isMorePresetsManuallyOpen, setIsMorePresetsManuallyOpen] = useState(false)

	const selectPreset = useCallback(
		(preset: EquitiesPreset) => {
			if (preset === selectedPreset) return
			void pushShallowQuery(router, { rankBy: PRESET_QUERY_SLUGS[preset] })
		},
		[router, selectedPreset]
	)

	const isMorePresetActive = EQUITIES_MORE_PRESETS.some((preset) => preset === selectedPreset)
	const showMorePresets = isMorePresetActive || isMorePresetsManuallyOpen

	const presetButtonClassName =
		'rounded-full border border-(--old-blue) px-3 py-1 text-xs hover:bg-(--link-hover-bg) data-[active=true]:bg-(--old-blue) data-[active=true]:text-white'

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center justify-center gap-2">
				<span className="text-sm font-medium text-(--text-secondary)">Rank by</span>
				{EQUITIES_PRIMARY_PRESETS.map((preset) => (
					<button
						key={preset}
						type="button"
						aria-current={preset === selectedPreset ? 'page' : undefined}
						data-active={preset === selectedPreset}
						data-umami-event="equities-preset-click"
						data-umami-event-preset={PRESET_QUERY_SLUGS[preset] ?? 'market-cap'}
						className={presetButtonClassName}
						onClick={() => selectPreset(preset)}
					>
						{preset}
					</button>
				))}
				{showMorePresets ? (
					<>
						{EQUITIES_MORE_PRESETS.map((preset) => (
							<button
								key={preset}
								type="button"
								aria-current={preset === selectedPreset ? 'page' : undefined}
								data-active={preset === selectedPreset}
								data-umami-event="equities-preset-click"
								data-umami-event-preset={PRESET_QUERY_SLUGS[preset]}
								className={presetButtonClassName}
								onClick={() => selectPreset(preset)}
							>
								{preset}
							</button>
						))}
						{isMorePresetsManuallyOpen && !isMorePresetActive ? (
							<button
								type="button"
								aria-expanded={true}
								onClick={() => setIsMorePresetsManuallyOpen(false)}
								className="flex items-center gap-1 rounded-full border border-(--old-blue) px-3 py-1 text-xs hover:bg-(--link-hover-bg)"
							>
								<Icon name="minus" height={12} width={12} />
								Less
							</button>
						) : null}
					</>
				) : (
					<button
						type="button"
						aria-expanded={false}
						data-active={isMorePresetActive}
						onClick={() => setIsMorePresetsManuallyOpen(true)}
						className={presetButtonClassName}
					>
						+ More
					</button>
				)}
			</div>

			<EquitiesRankingsTable key={selectedPreset} preset={selectedPreset} companies={companies} />

			<p className="px-1 text-xs text-(--text-disabled)">
				Market and statements data provided by{' '}
				<a href="https://twelvedata.com" target="_blank" rel="noopener noreferrer" className="underline">
					Twelve Data
				</a>
				. Filings data from SEC EDGAR.
				{updatedAt ? <span suppressHydrationWarning> Updated {formatEquitiesDateTime(updatedAt)}.</span> : null}
			</p>
		</div>
	)
}
