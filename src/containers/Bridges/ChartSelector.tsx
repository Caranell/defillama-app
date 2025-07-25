import * as React from 'react'
import { FormattedName } from '~/components/FormattedName'
import * as Ariakit from '@ariakit/react'

interface IProps {
	options: string[]
	selectedChart: string
	onClick: (e: any) => void
}

export function ChartSelector({ options, selectedChart, onClick }: IProps) {
	const onItemClick = (chartType: string) => {
		onClick(chartType)
	}

	return (
		<Ariakit.SelectProvider value={selectedChart} setValue={onClick}>
			<Ariakit.Select className="flex items-center justify-between gap-2 p-2 text-xs rounded-md cursor-pointer flex-nowrap border border-(--form-control-border) text-[#666] dark:text-[#919296] hover:bg-(--link-hover-bg) focus-visible:bg-(--link-hover-bg) font-medium mr-auto z-10">
				<FormattedName text={selectedChart} maxCharacters={20} fontSize={'16px'} fontWeight={600} />
				<Ariakit.SelectArrow />
			</Ariakit.Select>

			<Ariakit.SelectPopover
				unmountOnHide
				hideOnInteractOutside
				gutter={6}
				wrapperProps={{
					className: 'max-sm:fixed! max-sm:bottom-0! max-sm:top-[unset]! max-sm:transform-none! max-sm:w-full!'
				}}
				className="flex flex-col bg-(--bg1) rounded-md max-sm:rounded-b-none z-10 overflow-auto overscroll-contain min-w-[180px] border border-[hsl(204,20%,88%)] dark:border-[hsl(204,3%,32%)] max-sm:drawer h-full max-h-[70vh] sm:max-h-[60vh]"
			>
				{options.map((option) => (
					<Ariakit.SelectItem
						value={option}
						key={option}
						focusOnHover
						setValueOnClick={false}
						onClick={() => onItemClick(option)}
						className="flex items-center justify-between gap-4 py-2 px-3 shrink-0 hover:bg-(--primary1-hover) focus-visible:bg-(--primary1-hover) data-active-item:bg-(--primary1-hover) cursor-pointer first-of-type:rounded-t-md last-of-type:rounded-b-md border-b border-(--form-control-border)"
					>
						{option}
					</Ariakit.SelectItem>
				))}
			</Ariakit.SelectPopover>
		</Ariakit.SelectProvider>
	)
}
