import { usePolymarketBets, ParsedPolymarketMarket } from '~/api/categories/polymarket'
import { formattedNum } from '~/utils'

interface PolymarketBetsProps {
	name?: string | null
	symbol?: string | null
	chains?: string[] | null
}

export function PolymarketBets({ name, symbol, chains }: PolymarketBetsProps) {
	const { data: markets, isLoading, error } = usePolymarketBets({ name, symbol, chains })

	if (isLoading) {
		return (
			<div className="col-span-1 flex flex-col gap-2 rounded-md border border-(--cards-border) bg-(--cards-bg) p-2 xl:p-4">
				<div className="flex items-center gap-2">
					<PolymarketLogo />
					<h2 className="text-base font-semibold">Polymarket Predictions</h2>
				</div>
				<div className="flex animate-pulse flex-col gap-2">
					<div className="h-20 rounded-md bg-(--btn2-bg)" />
					<div className="h-20 rounded-md bg-(--btn2-bg)" />
				</div>
			</div>
		)
	}

	if (error || !markets || markets.length === 0) {
		return null
	}

	return (
		<div className="col-span-1 flex flex-col gap-2 rounded-md border border-(--cards-border) bg-(--cards-bg) p-2 xl:p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<PolymarketLogo />
					<h2 className="group relative flex items-center gap-1 text-base font-semibold" id="polymarket">
						Polymarket Predictions
						<a
							aria-hidden="true"
							tabIndex={-1}
							href="#polymarket"
							className="absolute top-0 right-0 z-10 flex h-full w-full items-center"
						/>
					</h2>
				</div>
				<a
					href="https://polymarket.com"
					target="_blank"
					rel="noreferrer noopener"
					className="text-xs text-(--text-label) hover:underline"
				>
					View all
				</a>
			</div>

			<div className="flex flex-col gap-2">
				{markets.slice(0, 5).map((market) => (
					<MarketCard key={market.id} market={market} />
				))}
			</div>
		</div>
	)
}

function MarketCard({ market }: { market: ParsedPolymarketMarket }) {
	const polymarketUrl = `https://polymarket.com/event/${market.eventSlug}`

	// Get the top outcome (usually "Yes" for binary markets)
	const topOutcome = market.outcomes[0]
	const probability = topOutcome ? Math.round(topOutcome.price * 100) : null

	return (
		<a
			href={polymarketUrl}
			target="_blank"
			rel="noreferrer noopener"
			className="group flex flex-col gap-2 rounded-md bg-(--btn2-bg) p-3 transition-colors hover:bg-(--btn2-hover-bg) focus-visible:bg-(--btn2-hover-bg)"
		>
			<p className="text-sm font-medium leading-tight">{market.question || market.eventTitle}</p>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				{probability !== null && (
					<div className="flex items-center gap-1.5">
						<span
							className={`text-lg font-bold ${
								probability >= 70 ? 'text-green-500' : probability <= 30 ? 'text-red-500' : 'text-(--text-primary)'
							}`}
						>
							{probability}%
						</span>
						<span className="text-xs text-(--text-label)">{topOutcome?.name || 'Yes'}</span>
					</div>
				)}

				{market.outcomes.length === 2 && market.outcomes[1] && (
					<div className="flex items-center gap-1.5">
						<span className="text-sm font-medium text-(--text-label)">
							{Math.round(market.outcomes[1].price * 100)}%
						</span>
						<span className="text-xs text-(--text-label)">{market.outcomes[1].name}</span>
					</div>
				)}

				<div className="ml-auto flex items-center gap-3 text-xs text-(--text-label)">
					{market.volume24hr > 0 && <span>24h: {formattedNum(market.volume24hr, true)}</span>}
					<span>Vol: {formattedNum(market.volume, true)}</span>
				</div>
			</div>

			{market.outcomes.length > 2 && (
				<div className="flex flex-wrap gap-2">
					{market.outcomes.slice(0, 4).map((outcome, idx) => (
						<div
							key={idx}
							className="flex items-center gap-1 rounded bg-(--cards-bg) px-2 py-0.5 text-xs"
						>
							<span className="font-medium">{Math.round(outcome.price * 100)}%</span>
							<span className="text-(--text-label)">{outcome.name}</span>
						</div>
					))}
					{market.outcomes.length > 4 && (
						<span className="text-xs text-(--text-label)">+{market.outcomes.length - 4} more</span>
					)}
				</div>
			)}
		</a>
	)
}

function PolymarketLogo() {
	return (
		<svg width="20" height="20" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect width="400" height="400" rx="80" fill="#1652F0" />
			<path
				d="M200 100C144.772 100 100 144.772 100 200C100 255.228 144.772 300 200 300C255.228 300 300 255.228 300 200C300 144.772 255.228 100 200 100ZM200 260C166.863 260 140 233.137 140 200C140 166.863 166.863 140 200 140C233.137 140 260 166.863 260 200C260 233.137 233.137 260 200 260Z"
				fill="white"
			/>
			<circle cx="200" cy="200" r="40" fill="white" />
		</svg>
	)
}
