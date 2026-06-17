import {
	createColumnHelper,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table'
import { useMemo } from 'react'
import { CSVDownloadButton } from '~/components/ButtonStyled/CsvButton'
import { Icon } from '~/components/Icon'
import { BasicLink } from '~/components/Link'
import { PaginatedTable } from '~/components/Table/PaginatedTable'
import { prepareTableCsv } from '~/components/Table/utils'
import { abbreviateNumber } from '~/utils'
import type { IEquitiesOnchainMarketRow, IEquitiesOnchainTokenRow } from './types'
import { formatEquitiesDateTime } from './utils'

const TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const
const DEFAULT_TABLE_PAGE_SIZE = 10

const marketsColumnHelper = createColumnHelper<IEquitiesOnchainMarketRow>()
const tokensColumnHelper = createColumnHelper<IEquitiesOnchainTokenRow>()

function formatValue(value: unknown, symbol?: string): string {
	return abbreviateNumber(value, 2, symbol) ?? '-'
}

function formatFundingRate(value: number | null): string {
	return value == null ? '-' : `${formatValue(value)}%`
}

function rwaPerpsContractHref(slug: string): string {
	return `/rwa/perps/contract/${encodeURIComponent(slug)}`
}

function protocolHref(slug: string): string {
	return `/protocol/${slug}`
}

function rwaPlatformHref(slug: string): string {
	return `/rwa/platform/${slug}`
}

function rwaAssetHref(slug: string): string {
	return `/rwa/asset/${encodeURIComponent(slug)}`
}

const marketsColumns = [
	marketsColumnHelper.accessor('pair', {
		header: 'Pair',
		enableSorting: false,
		meta: {
			headerClassName: 'w-[132px]',
			align: 'start'
		}
	}),
	marketsColumnHelper.accessor('contractSlug', {
		header: 'Contract',
		enableSorting: false,
		cell: ({ getValue }) => (
			<BasicLink href={rwaPerpsContractHref(getValue())} className="text-(--link-text) hover:underline">
				{getValue()}
			</BasicLink>
		),
		meta: {
			headerClassName: 'w-[168px]',
			align: 'start'
		}
	}),
	marketsColumnHelper.accessor('price', {
		header: 'Price',
		cell: ({ getValue }) => formatValue(getValue(), '$'),
		meta: {
			headerClassName: 'w-[112px]',
			align: 'end'
		}
	}),
	marketsColumnHelper.accessor('volume24h', {
		header: '24h Volume',
		cell: ({ getValue }) => formatValue(getValue(), '$'),
		meta: {
			headerClassName: 'w-[124px]',
			align: 'end'
		}
	}),
	marketsColumnHelper.accessor('openInterest', {
		header: 'Open Interest',
		cell: ({ getValue }) => formatValue(getValue(), '$'),
		meta: {
			headerClassName: 'w-[132px]',
			align: 'end'
		}
	}),
	marketsColumnHelper.accessor('annualizedFundingRate', {
		header: 'Funding APR',
		cell: ({ getValue }) => formatFundingRate(getValue()),
		meta: {
			headerClassName: 'w-[124px]',
			align: 'end'
		}
	}),
	marketsColumnHelper.accessor('exchangeName', {
		header: 'Exchange',
		enableSorting: false,
		cell: ({ getValue, row }) =>
			row.original.exchangeProtocolSlug ? (
				<BasicLink
					href={protocolHref(row.original.exchangeProtocolSlug)}
					className="text-(--link-text) hover:underline"
				>
					{getValue()}
				</BasicLink>
			) : (
				'-'
			),
		meta: {
			headerClassName: 'w-[180px]',
			align: 'start'
		}
	}),
	marketsColumnHelper.accessor('platformName', {
		header: 'Platform',
		enableSorting: false,
		cell: ({ getValue, row }) =>
			row.original.rwaPlatformSlug ? (
				<BasicLink href={rwaPlatformHref(row.original.rwaPlatformSlug)} className="text-(--link-text) hover:underline">
					{getValue()}
				</BasicLink>
			) : (
				'-'
			),
		meta: {
			headerClassName: 'w-[180px]',
			align: 'start'
		}
	}),
	marketsColumnHelper.accessor('tradeUrl', {
		header: 'Trade',
		enableSorting: false,
		cell: ({ getValue }) => (
			<a
				href={getValue()}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-1 text-(--link-text) hover:underline"
			>
				Open
				<Icon name="arrow-up-right" height={14} width={14} />
			</a>
		),
		meta: {
			headerClassName: 'w-[92px]',
			align: 'end'
		}
	}),
	marketsColumnHelper.accessor('updatedAt', {
		header: 'Updated',
		cell: ({ getValue }) => (
			<span className="whitespace-nowrap" suppressHydrationWarning>
				{formatEquitiesDateTime(getValue())}
			</span>
		),
		meta: {
			headerClassName: 'w-[172px]',
			align: 'end'
		}
	})
]

const tokensColumns = [
	tokensColumnHelper.accessor('assetSlug', {
		header: 'Asset',
		enableSorting: false,
		cell: ({ getValue }) => (
			<BasicLink href={rwaAssetHref(getValue())} className="text-(--link-text) hover:underline">
				{getValue()}
			</BasicLink>
		),
		meta: {
			headerClassName: 'w-[132px]',
			align: 'start'
		}
	}),
	tokensColumnHelper.accessor('issuerRwaPlatformName', {
		header: 'Platform',
		enableSorting: false,
		cell: ({ getValue, row }) => (
			<BasicLink
				href={rwaPlatformHref(row.original.issuerRwaPlatformSlug)}
				className="text-(--link-text) hover:underline"
			>
				{getValue()}
			</BasicLink>
		),
		meta: {
			headerClassName: 'w-[180px]',
			align: 'start'
		}
	}),
	tokensColumnHelper.accessor('price', {
		header: 'Price',
		cell: ({ getValue }) => formatValue(getValue(), '$'),
		meta: {
			headerClassName: 'w-[112px]',
			align: 'end'
		}
	}),
	tokensColumnHelper.accessor('activeMarketcap', {
		header: 'Active Market Cap',
		cell: ({ getValue }) => formatValue(getValue(), '$'),
		meta: {
			headerClassName: 'w-[160px]',
			align: 'end'
		}
	}),
	tokensColumnHelper.accessor('issuer', {
		header: 'Issuer',
		enableSorting: false,
		meta: {
			headerClassName: 'w-[min(320px,48vw)]',
			align: 'start'
		}
	})
]

function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<p className="rounded-md border border-dashed border-(--cards-border) p-3 text-sm text-(--text-secondary)">
			{children}
		</p>
	)
}

export function EquitiesMarketsTable({ markets, ticker }: { markets: IEquitiesOnchainMarketRow[]; ticker: string }) {
	const data = useMemo(() => markets, [markets])
	const table = useReactTable({
		data,
		columns: marketsColumns,
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: DEFAULT_TABLE_PAGE_SIZE
			},
			sorting: [{ id: 'volume24h', desc: true }]
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	})

	return (
		<section className="col-span-full flex flex-col gap-4 rounded-md border border-(--cards-border) bg-(--cards-bg) p-2 xl:p-4">
			<div className="flex flex-wrap items-center justify-end gap-2">
				<CSVDownloadButton
					prepareCsv={() => prepareTableCsv({ instance: table, filename: `equities-${ticker.toLowerCase()}-markets` })}
					smol
				/>
			</div>
			{data.length === 0 ? <EmptyState>No on-chain markets found for {ticker}.</EmptyState> : null}
			<PaginatedTable table={table} pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS} />
		</section>
	)
}

export function EquitiesTokensTable({ tokens, ticker }: { tokens: IEquitiesOnchainTokenRow[]; ticker: string }) {
	const data = useMemo(() => tokens, [tokens])
	const table = useReactTable({
		data,
		columns: tokensColumns,
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: DEFAULT_TABLE_PAGE_SIZE
			},
			sorting: [{ id: 'activeMarketcap', desc: true }]
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	})

	return (
		<section className="col-span-full flex flex-col gap-4 rounded-md border border-(--cards-border) bg-(--cards-bg) p-2 xl:p-4">
			<div className="flex flex-wrap items-center justify-end gap-2">
				<CSVDownloadButton
					prepareCsv={() => prepareTableCsv({ instance: table, filename: `equities-${ticker.toLowerCase()}-tokens` })}
					smol
				/>
			</div>
			{data.length === 0 ? <EmptyState>No tokenized assets found for {ticker}.</EmptyState> : null}
			<PaginatedTable table={table} pageSizeOptions={TABLE_PAGE_SIZE_OPTIONS} />
		</section>
	)
}
