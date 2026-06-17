import {
	createColumnHelper,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { CSVDownloadButton } from '~/components/ButtonStyled/CsvButton'
import { Icon } from '~/components/Icon'
import { PaginatedTable } from '~/components/Table/PaginatedTable'
import { prepareTableCsv, useTableSearch } from '~/components/Table/utils'
import type { IEquitiesFilingApiItem } from './api.types'
import { formatEquitiesDate } from './utils'

const columnHelper = createColumnHelper<IEquitiesFilingApiItem>()
const DEFAULT_SORTING_STATE: SortingState = [{ id: 'filingDate', desc: true }]
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 10

const columns = [
	columnHelper.accessor('filingDate', {
		header: 'Filing Date',
		cell: ({ getValue }) => formatEquitiesDate(getValue()),
		meta: {
			headerClassName: 'w-[120px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('reportDate', {
		header: 'Report Date',
		cell: ({ getValue }) => formatEquitiesDate(getValue()),
		meta: {
			headerClassName: 'w-[120px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('form', {
		header: 'Form',
		meta: {
			headerClassName: 'w-[84px]',
			align: 'start'
		}
	}),
	columnHelper.accessor('documentDescription', {
		header: 'Description',
		filterFn: (row, _columnId, filterValue) => {
			const query = String(filterValue).trim().toLowerCase()
			if (!query) return true
			return (
				row.original.documentDescription.toLowerCase().includes(query) ||
				row.original.form.toLowerCase().includes(query)
			)
		},
		meta: {
			headerClassName: 'w-[min(520px,40vw)]',
			align: 'start'
		}
	}),
	columnHelper.accessor('primaryDocumentUrl', {
		header: 'Source URL',
		enableSorting: false,
		cell: ({ getValue }) => (
			<span className="flex w-full max-w-[80px] items-center justify-end">
				<a
					href={getValue()}
					target="_blank"
					rel="noopener noreferrer"
					className="flex flex-1 items-center justify-center gap-4 rounded-md bg-(--btn2-bg) p-1.5 hover:bg-(--btn2-hover-bg)"
				>
					<Icon name="arrow-up-right" height={14} width={14} />
					<span className="sr-only">open in new tab</span>
				</a>
			</span>
		),
		meta: {
			headerClassName: 'w-[120px]',
			align: 'end'
		}
	})
]

export function EquitiesFilingsTable({
	filings,
	filingForms
}: {
	filings: IEquitiesFilingApiItem[]
	filingForms: string[]
}) {
	const [selectedForm, setSelectedForm] = useState<string>('All')

	const filteredFilings = useMemo(() => {
		if (selectedForm === 'All') return filings
		const matchingFilings: IEquitiesFilingApiItem[] = []
		for (const filing of filings) {
			if (filing.form === selectedForm) matchingFilings.push(filing)
		}
		return matchingFilings
	}, [filings, selectedForm])
	const table = useReactTable({
		data: filteredFilings,
		columns,
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: DEFAULT_PAGE_SIZE
			},
			sorting: DEFAULT_SORTING_STATE
		},
		enableSortingRemoval: false,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	})
	const [_searchValue, setSearchValue] = useTableSearch({ instance: table, columnToSearch: 'documentDescription' })

	return (
		<div className="rounded-md border border-(--cards-border) bg-(--cards-bg)">
			<div className="flex w-full flex-wrap items-center justify-end gap-3 p-3">
				<label className="relative mr-auto w-full max-w-full sm:max-w-[280px]">
					<span className="sr-only">Search filings</span>
					<Icon
						name="search"
						height={16}
						width={16}
						className="absolute top-0 bottom-0 left-2 my-auto text-(--text-tertiary)"
					/>
					<input
						onInput={(e) => setSearchValue(e.currentTarget.value)}
						placeholder="Search filings"
						className="w-full rounded-md border border-(--form-control-border) bg-white p-1 pl-7 text-black dark:bg-black dark:text-white"
					/>
				</label>
				<label className="flex items-center gap-2 text-sm">
					<span className="text-(--text-form)">Form</span>
					<select
						value={selectedForm}
						onChange={(e) => setSelectedForm(e.currentTarget.value)}
						className="rounded-md border border-(--form-control-border) bg-white px-2 py-1 text-black dark:bg-black dark:text-white"
					>
						<option value="All">All</option>
						{filingForms.map((form) => (
							<option key={form} value={form}>
								{form}
							</option>
						))}
					</select>
				</label>
				<CSVDownloadButton prepareCsv={() => prepareTableCsv({ instance: table, filename: 'equities-filings' })} smol />
			</div>
			<PaginatedTable table={table} pageSizeOptions={PAGE_SIZE_OPTIONS} />
		</div>
	)
}
