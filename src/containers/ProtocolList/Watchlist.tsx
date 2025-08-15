import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Menu } from '~/components/Menu'
import {
	DEFAULT_PORTFOLIO_NAME,
	useLocalStorageSettingsManager,
	useWatchlistManager,
	useChainsWatchlistManager
} from '~/contexts/LocalStorage'
import { formatDataWithExtraTvls, formatProtocolsList } from '~/hooks/data/defi'
import { useGetProtocolsList } from '~/api/categories/protocols/client'
import { useGetProtocolsFeesAndRevenueByChain, useGetProtocolsVolumeByChain } from '~/api/categories/chains/client'
import { ProtocolsByChainTable } from '~/components/Table/Defi/Protocols'
import { Icon } from '~/components/Icon'
import { ProtocolsChainsSearch } from '~/components/Search/ProtocolsChains'
import { WatchListTabs } from '../Yields/Watchlist'
import { SelectWithCombobox } from '~/components/SelectWithCombobox'
import type { IFormattedProtocol } from '~/api/types'
import { tvlOptions } from '~/components/Filters/options'
import { ChainsByCategoryTable } from '~/containers/ChainsByCategory/Table'
import { CHAINS_API_V2, ACTIVE_USERS_API, CHAINS_ASSETS, TEMP_CHAIN_NFTS } from '~/constants'
import { fetchJson, postRuntimeLogs } from '~/utils/async'
import metadataCache from '~/utils/metadata'
import { slug } from '~/utils'
import { getAdapterChainOverview } from '~/containers/DimensionAdapters/queries'
import { getPeggedAssets } from '~/containers/Stablecoins/queries.server'
import {
	ADAPTER_TYPES,
	ADAPTER_TYPES_TO_METADATA_TYPE,
	ADAPTER_DATA_TYPES
} from '~/containers/DimensionAdapters/constants'

// Helper function to get dimension adapter data for all chains
async function getDimensionAdapterOverviewOfAllChains({
	adapterType,
	dataType
}: {
	adapterType: `${ADAPTER_TYPES}`
	dataType?: `${ADAPTER_DATA_TYPES}`
}) {
	const metadataCache = await import('~/utils/metadata').then((m) => m.default)

	const chains = []
	for (const chain in metadataCache.chainMetadata) {
		if (metadataCache.chainMetadata[chain][ADAPTER_TYPES_TO_METADATA_TYPE[adapterType]]) {
			chains.push(chain)
		}
	}

	const data = await Promise.all(
		chains.map((chain) =>
			getAdapterChainOverview({
				chain,
				adapterType,
				excludeTotalDataChart: true,
				excludeTotalDataChartBreakdown: true,
				dataType
			}).catch(() => {
				postRuntimeLogs(`getDimensionAdapterOverviewOfAllChains:${chain}:${adapterType}:failed`)
				return null
			})
		)
	)

	return data.filter(Boolean)
}

export function DefiWatchlistContainer() {
	const { portfolios, selectedPortfolio, addPortfolio, removePortfolio, setSelectedPortfolio } =
		useWatchlistManager('defi')

	return (
		<>
			<ProtocolsChainsSearch options={tvlOptions} />
			<WatchListTabs />
			<div className="bg-(--cards-bg) border border-(--cards-border) rounded-md">
				<PortfolioSelection
					portfolios={portfolios}
					selectedPortfolio={selectedPortfolio}
					setSelectedPortfolio={setSelectedPortfolio}
					addPortfolio={addPortfolio}
					removePortfolio={removePortfolio}
				/>
				<div className="flex flex-col lg:flex-row border-b border-(--cards-border)">
					<div className="flex-1 lg:border-r lg:border-(--cards-border)">
						<ProtocolsManager selectedPortfolio={selectedPortfolio} />
					</div>
					<div className="flex-1">
						<ChainsManager selectedPortfolio={selectedPortfolio} />
					</div>
				</div>
				<PortfolioItems selectedPortfolio={selectedPortfolio} />
			</div>
		</>
	)
}

// Protocols Manager Component
function ProtocolsManager({ selectedPortfolio }: { selectedPortfolio: string }) {
	const [extraTvlsEnabled] = useLocalStorageSettingsManager('tvl')

	const { fullProtocolsList, parentProtocols, isLoading: fetchingProtocolsList } = useGetProtocolsList({ chain: 'All' })

	const { data: chainProtocolsVolumes, isLoading: fetchingProtocolsVolumeByChain } = useGetProtocolsVolumeByChain('All')

	const { data: chainProtocolsFees, isLoading: fetchingProtocolsFeesAndRevenueByChain } =
		useGetProtocolsFeesAndRevenueByChain('All')

	const { savedProtocols, addProtocol, removeProtocol } = useWatchlistManager('defi')

	const formattedProtocols = useMemo(() => {
		return formatProtocolsList({
			extraTvlsEnabled,
			protocols: fullProtocolsList,
			volumeData: chainProtocolsVolumes,
			feesData: chainProtocolsFees,
			parentProtocols: parentProtocols,
			noSubrows: true
		})
	}, [fullProtocolsList, parentProtocols, extraTvlsEnabled, chainProtocolsVolumes, chainProtocolsFees])

	const protocolOptions = useMemo(() => {
		return formattedProtocols.map((protocol) => ({
			key: protocol.name,
			name: protocol.name
		}))
	}, [formattedProtocols])

	const selectedProtocolNames = useMemo(() => {
		return Array.from(savedProtocols)
	}, [savedProtocols])

	const handleProtocolSelection = (selectedValues: string[]) => {
		const currentSet = new Set(selectedProtocolNames)
		const newSet = new Set(selectedValues)

		const toAdd = selectedValues.filter((name) => !currentSet.has(name))
		const toRemove = selectedProtocolNames.filter((name) => !newSet.has(name))

		toAdd.forEach((name) => addProtocol(name))
		toRemove.forEach((name) => removeProtocol(name))
	}

	return (
		<ProtocolSelection
			protocolOptions={protocolOptions}
			selectedProtocolNames={selectedProtocolNames}
			handleProtocolSelection={handleProtocolSelection}
			selectedPortfolio={selectedPortfolio}
		/>
	)
}

// Hook to fetch comprehensive chain data
function useEnhancedChainsData() {
	const [extraTvlsEnabled] = useLocalStorageSettingsManager('tvl')

	return useQuery({
		queryKey: ['enhanced-chains-data', extraTvlsEnabled],
		queryFn: async () => {
			// Fetch all data sources in parallel similar to getChainsByCategory
			const [
				chainsResponse,
				dexsData,
				feesData,
				revenueData,
				stablecoinsData,
				activeUsersData,
				chainsAssetsData,
				chainNftsVolumeData,
				appRevenueData
			] = await Promise.all([
				fetchJson(`${CHAINS_API_V2}/All`),
				getDimensionAdapterOverviewOfAllChains({ adapterType: 'dexs' }).catch((err) => {
					console.log('Failed to fetch DEXs data:', err)
					return []
				}),
				getAdapterChainOverview({
					adapterType: 'fees',
					chain: 'All',
					excludeTotalDataChart: true,
					excludeTotalDataChartBreakdown: true
				}).catch((err) => {
					console.log('Failed to fetch fees data:', err)
					return null
				}),
				getAdapterChainOverview({
					adapterType: 'fees',
					chain: 'All',
					excludeTotalDataChart: true,
					excludeTotalDataChartBreakdown: true,
					dataType: 'dailyRevenue'
				}).catch((err) => {
					console.log('Failed to fetch revenue data:', err)
					return null
				}),
				getPeggedAssets().catch((err) => {
					console.log('Failed to fetch stablecoins data:', err)
					return { chains: [] }
				}),
				fetchJson(ACTIVE_USERS_API).catch((err) => {
					console.log('Failed to fetch active users data:', err)
					return {}
				}),
				fetchJson(CHAINS_ASSETS).catch((err) => {
					console.log('Failed to fetch chain assets data:', err)
					return null
				}),
				fetchJson(TEMP_CHAIN_NFTS).catch((err) => {
					console.log('Failed to fetch chain NFTs data:', err)
					return {}
				}),
				getDimensionAdapterOverviewOfAllChains({ adapterType: 'fees', dataType: 'dailyAppRevenue' }).catch((err) => {
					console.log('Failed to fetch app revenue data:', err)
					return []
				})
			])

			const chainTvls = chainsResponse?.chainTvls ?? []

			// Calculate stables mcap by chain
			const stablesChainMcaps =
				stablecoinsData?.chains?.map((chain: any) => ({
					name: chain.name,
					mcap: Object.values(chain.totalCirculatingUSD || {}).reduce((a: number, b: number) => a + b, 0)
				})) ?? []

			// Enhance chains with all additional data
			const enhancedChains = chainTvls.map((chain: any) => {
				const name = slug(chain.name)
				const nftVolume = chainNftsVolumeData?.[name] ?? null
				const totalFees24h = feesData?.protocols?.find((x: any) => x.displayName === chain.name)?.total24h ?? null
				const totalRevenue24h = revenueData?.protocols?.find((x: any) => x.displayName === chain.name)?.total24h ?? null
				const totalAppRevenue24h = appRevenueData?.find((x: any) => x.chain === chain.name)?.total24h ?? null
				const totalVolume24h = dexsData?.find((x: any) => x.chain === chain.name)?.total24h ?? null
				const stablesMcap = stablesChainMcaps.find((x: any) => slug(x.name) === name)?.mcap ?? null
				const users = activeUsersData?.[`chain#${name}`]?.users?.value
				const protocols = metadataCache.chainMetadata?.[name]?.protocolCount ?? chain.protocols ?? 0

				return {
					...chain,
					protocols,
					nftVolume: nftVolume ? +Number(nftVolume).toFixed(2) : null,
					totalVolume24h,
					totalFees24h,
					totalRevenue24h,
					totalAppRevenue24h,
					stablesMcap,
					users: users ? +users : null
				}
			})

			// Format with extra TVLs and chain assets
			const formattedChains = formatDataWithExtraTvls({
				data: enhancedChains,
				applyLqAndDc: true,
				extraTvlsEnabled,
				chainAssets: chainsAssetsData
			})

			return formattedChains
		},
		staleTime: 60 * 60 * 1000, // 1 hour
		retry: 1
	})
}

// Chains Manager Component
function ChainsManager({ selectedPortfolio }: { selectedPortfolio: string }) {
	const { data: formattedChains = [], isLoading, isError } = useEnhancedChainsData()

	const { savedChains, addChain, removeChain } = useChainsWatchlistManager()

	const chainOptions = useMemo(() => {
		return formattedChains.map((c: any) => ({ key: c.name, name: c.name }))
	}, [formattedChains])

	const selectedChainNames = useMemo(() => Array.from(savedChains), [savedChains])

	const handleChainSelection = (selectedValues: string[]) => {
		const currentSet = new Set(selectedChainNames)
		const newSet = new Set(selectedValues)

		const toAdd = selectedValues.filter((name) => !currentSet.has(name))
		const toRemove = selectedChainNames.filter((name) => !newSet.has(name))

		toAdd.forEach((name) => addChain(name))
		toRemove.forEach((name) => removeChain(name))
	}

	if (isError) {
		console.error('Failed to load enhanced chains data')
	}

	return (
		<ChainSelection
			chainOptions={chainOptions}
			selectedChainNames={selectedChainNames}
			handleChainSelection={handleChainSelection}
			selectedPortfolio={selectedPortfolio}
			isLoading={isLoading}
		/>
	)
}

type PortfolioItemsProps = {
	selectedPortfolio: string
}

function PortfolioItems({ selectedPortfolio }: PortfolioItemsProps) {
	const [extraTvlsEnabled] = useLocalStorageSettingsManager('tvl')

	// Protocols data
	const { fullProtocolsList, parentProtocols, isLoading: fetchingProtocolsList } = useGetProtocolsList({ chain: 'All' })
	const { data: chainProtocolsVolumes, isLoading: fetchingProtocolsVolumeByChain } = useGetProtocolsVolumeByChain('All')
	const { data: chainProtocolsFees, isLoading: fetchingProtocolsFeesAndRevenueByChain } =
		useGetProtocolsFeesAndRevenueByChain('All')
	const { savedProtocols } = useWatchlistManager('defi')

	const formattedProtocols = useMemo(() => {
		return formatProtocolsList({
			extraTvlsEnabled,
			protocols: fullProtocolsList,
			volumeData: chainProtocolsVolumes,
			feesData: chainProtocolsFees,
			parentProtocols: parentProtocols,
			noSubrows: true
		})
	}, [fullProtocolsList, parentProtocols, extraTvlsEnabled, chainProtocolsVolumes, chainProtocolsFees])

	const filteredProtocols = useMemo(() => {
		return formattedProtocols.filter((p) => savedProtocols.has(p.name))
	}, [formattedProtocols, savedProtocols])

	const loadingProtocols =
		fetchingProtocolsList || fetchingProtocolsVolumeByChain || fetchingProtocolsFeesAndRevenueByChain

	// Enhanced chains data
	const { data: formattedChains = [], isLoading: fetchingChains } = useEnhancedChainsData()
	const { savedChains } = useChainsWatchlistManager()

	const filteredChains = useMemo(() => {
		return formattedChains.filter((c: any) => savedChains.has(c.name))
	}, [formattedChains, savedChains])

	const selectedProtocolNames = Array.from(savedProtocols)
	const selectedChainNames = Array.from(savedChains)
	const hasNoItems = selectedProtocolNames.length === 0 && selectedChainNames.length === 0

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-medium">
					{selectedPortfolio === DEFAULT_PORTFOLIO_NAME ? 'Watchlist' : `${selectedPortfolio} Portfolio`}
				</h2>
				{(selectedProtocolNames.length > 0 || selectedChainNames.length > 0) && (
					<div className="flex items-center gap-4">
						{selectedProtocolNames.length > 0 && (
							<span className="text-sm text-(--text-secondary)">
								{selectedProtocolNames.length} protocol{selectedProtocolNames.length === 1 ? '' : 's'}
							</span>
						)}
						{selectedChainNames.length > 0 && (
							<span className="text-sm text-(--text-secondary)">
								{selectedChainNames.length} chain{selectedChainNames.length === 1 ? '' : 's'}
							</span>
						)}
					</div>
				)}
			</div>
			{hasNoItems ? (
				<div className="p-8 text-center">
					<div className="max-w-sm mx-auto">
						<Icon name="bookmark" height={48} width={48} className="mx-auto mb-4 text-(--text-secondary) opacity-50" />
						<p className="text-(--text-secondary) mb-2">No items in this portfolio</p>
						<p className="text-sm text-(--text-secondary) opacity-75">
							Use the selectors above to add items to your portfolio
						</p>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{filteredProtocols.length > 0 && <TopMovers protocols={filteredProtocols} />}
					<PortfolioProtocols loadingProtocols={loadingProtocols} filteredProtocols={filteredProtocols} />
					<PortfolioChains loadingChains={fetchingChains} filteredChains={filteredChains} />
				</div>
			)}
		</div>
	)
}

function PortfolioProtocols({ loadingProtocols, filteredProtocols }: any) {
	return loadingProtocols ? (
		<div className="p-8 text-center">
			<div className="inline-flex items-center gap-2 text-(--text-secondary)">
				<div className="animate-spin rounded-full h-4 w-4 border-2 border-(--text-secondary) border-t-transparent"></div>
				<span>Loading protocols...</span>
			</div>
		</div>
	) : filteredProtocols.length ? (
		<ProtocolsByChainTable data={filteredProtocols} title="Protocols" />
	) : null
}

function PortfolioChains({ loadingChains, filteredChains }: any) {
	return loadingChains ? (
		<div className="p-8 text-center">
			<div className="inline-flex items-center gap-2 text-(--text-secondary)">
				<div className="animate-spin rounded-full h-4 w-4 border-2 border-(--text-secondary) border-t-transparent"></div>
				<span>Loading chains...</span>
			</div>
		</div>
	) : filteredChains.length ? (
		<ChainsByCategoryTable data={filteredChains as any} title="Chains" showSearch={false} />
	) : null
}

type PortfolioSelectionProps = {
	portfolios: string[]
	selectedPortfolio: string
	setSelectedPortfolio: (value: string) => void
	addPortfolio: (name: string) => void
	removePortfolio: (name: string) => void
}

function PortfolioSelection({
	portfolios,
	selectedPortfolio,
	setSelectedPortfolio,
	addPortfolio,
	removePortfolio
}: PortfolioSelectionProps) {
	return (
		<div className="p-4 border-b border-(--cards-border)">
			<h1 className="text-xl font-semibold mb-4">Portfolio</h1>
			<div className="flex items-center flex-wrap gap-4">
				<span className="text-sm font-medium text-(--text-primary)">Active portfolio:</span>
				<Menu
					name={selectedPortfolio.length > 100 ? selectedPortfolio.substring(0, 100) + '...' : selectedPortfolio}
					key={`${selectedPortfolio}-${portfolios.length}`}
					options={portfolios}
					onItemClick={(value) => setSelectedPortfolio(value)}
					className="flex items-center justify-between gap-2 py-2 px-3 text-sm rounded-md cursor-pointer flex-nowrap relative border border-(--form-control-border) text-(--text-primary) hover:bg-(--link-hover-bg) focus-visible:bg-(--link-hover-bg) font-medium min-w-[120px]"
				/>
				<button
					onClick={() => {
						const newPortfolio = prompt('Enter a name for the new portfolio')
						if (newPortfolio) {
							addPortfolio(newPortfolio)
						}
					}}
					className="flex items-center gap-2 py-2 px-3 text-sm rounded-md hover:bg-(--link-hover-bg) focus-visible:bg-(--link-hover-bg) transition-colors border border-(--form-control-border) text-(--text-primary)"
					title="Create new portfolio"
				>
					<Icon name="folder-plus" height={16} width={16} />
					<span>New</span>
				</button>
				{selectedPortfolio !== DEFAULT_PORTFOLIO_NAME && (
					<button
						onClick={() => removePortfolio(selectedPortfolio)}
						className="flex items-center gap-2 py-2 px-3 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:bg-red-50 dark:focus-visible:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
						title="Delete current portfolio"
					>
						<Icon name="trash-2" height={16} width={16} />
						<span>Delete</span>
					</button>
				)}
			</div>
		</div>
	)
}

type ProtocolSelectionProps = {
	protocolOptions: Array<{ key: string; name: string }>
	selectedProtocolNames: string[]
	handleProtocolSelection: (selectedValues: string[]) => void
	selectedPortfolio: string
}

function ProtocolSelection({
	protocolOptions,
	selectedProtocolNames,
	handleProtocolSelection,
	selectedPortfolio
}: ProtocolSelectionProps) {
	return (
		<div className="p-4">
			<div className="mb-3">
				<h2 className="text-lg font-medium mb-1">Manage Protocols</h2>
				<p className="text-sm text-(--text-secondary)">
					Select or deselect protocols for the "{selectedPortfolio}" portfolio
				</p>
			</div>
			<SelectWithCombobox
				allValues={protocolOptions}
				selectedValues={selectedProtocolNames}
				setSelectedValues={handleProtocolSelection}
				label={
					selectedProtocolNames.length > 0
						? `${selectedProtocolNames.length} protocol${selectedProtocolNames.length === 1 ? '' : 's'} selected`
						: 'Select protocols...'
				}
				labelType="regular"
			/>
		</div>
	)
}

type ChainSelectionProps = {
	chainOptions: Array<{ key: string; name: string }>
	selectedChainNames: string[]
	handleChainSelection: (selectedValues: string[]) => void
	selectedPortfolio: string
	isLoading?: boolean
}

function ChainSelection({
	chainOptions,
	selectedChainNames,
	handleChainSelection,
	selectedPortfolio,
	isLoading = false
}: ChainSelectionProps) {
	return (
		<div className="p-4">
			<div className="mb-3">
				<h2 className="text-lg font-medium mb-1">Manage Chains</h2>
				<p className="text-sm text-(--text-secondary)">
					Select or deselect chains for the "{selectedPortfolio}" portfolio
				</p>
			</div>
			{isLoading ? (
				<div className="flex items-center gap-2 p-3 border border-(--form-control-border) rounded-md bg-(--bg-main)">
					<div className="animate-spin rounded-full h-4 w-4 border-2 border-(--text-secondary) border-t-transparent"></div>
					<span className="text-sm text-(--text-secondary)">Loading chains...</span>
				</div>
			) : (
				<SelectWithCombobox
					allValues={chainOptions}
					selectedValues={selectedChainNames}
					setSelectedValues={handleChainSelection}
					label={
						selectedChainNames.length > 0
							? `${selectedChainNames.length} chain${selectedChainNames.length === 1 ? '' : 's'} selected`
							: 'Select chains...'
					}
					labelType="regular"
				/>
			)}
		</div>
	)
}

type TopMoversProps = {
	protocols: IFormattedProtocol[]
}

function TopMovers({ protocols }: TopMoversProps) {
	const [showPositiveMoves, setShowPositiveMoves] = useState(true)
	const [showNegativeMoves, setShowNegativeMoves] = useState(true)
	const [selectedChains, setSelectedChains] = useState<string[]>([])

	const availableChains = useMemo(() => {
		const chainSet = new Set<string>()
		protocols.forEach((protocol) => {
			protocol.chains?.forEach((chain) => chainSet.add(chain))
		})
		return Array.from(chainSet).sort()
	}, [protocols])

	const topMovers = useMemo(() => {
		const periods = ['1d', '7d', '1m']
		const movers: Record<string, Array<{ name: string; change: number; chains: string[] }>> = {}

		periods.forEach((period) => {
			const changeKey = `change_${period}`
			let candidates = protocols
				.filter((p) => p[changeKey] !== null && p[changeKey] !== undefined)
				.map((p) => ({
					name: p.name,
					change: p[changeKey] as number,
					chains: p.chains || []
				}))

			if (!showPositiveMoves && !showNegativeMoves) {
				candidates = []
			} else if (showPositiveMoves && !showNegativeMoves) {
				candidates = candidates.filter((p) => p.change > 0)
			} else if (!showPositiveMoves && showNegativeMoves) {
				candidates = candidates.filter((p) => p.change < 0)
			}

			if (selectedChains.length > 0) {
				candidates = candidates.filter((p) => p.chains.some((chain) => selectedChains.includes(chain)))
			}

			candidates.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
			movers[period] = candidates.slice(0, 3)
		})

		return movers
	}, [protocols, showPositiveMoves, showNegativeMoves, selectedChains])

	const chainOptions = useMemo(() => {
		return availableChains.map((chain) => ({
			key: chain,
			name: chain
		}))
	}, [availableChains])

	return (
		<div className="p-4 border-b border-(--cards-border)">
			<div className="mb-4">
				<h2 className="text-lg font-medium mb-1">Top Movers</h2>
				<p className="text-sm text-(--text-secondary)">Biggest changes in your portfolio</p>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-4 mb-4">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-(--text-secondary)">Show:</span>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showPositiveMoves}
							onChange={(e) => setShowPositiveMoves(e.target.checked)}
							className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
						/>
						<span className="text-sm text-green-600">Positive moves</span>
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={showNegativeMoves}
							onChange={(e) => setShowNegativeMoves(e.target.checked)}
							className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
						/>
						<span className="text-sm text-red-600">Negative moves</span>
					</label>
				</div>

				{availableChains.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-(--text-secondary)">Chains:</span>
						<SelectWithCombobox
							allValues={chainOptions}
							selectedValues={selectedChains}
							setSelectedValues={setSelectedChains}
							label={
								selectedChains.length > 0
									? `${selectedChains.length} chain${selectedChains.length === 1 ? '' : 's'}`
									: 'All chains'
							}
							labelType="regular"
						/>
					</div>
				)}
			</div>

			{/* Top Movers Cards */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{(['1d', '7d', '1m'] as const).map((period) => (
					<div key={period} className="bg-(--bg-secondary) rounded-lg p-4">
						<h3 className="font-medium text-(--text-primary) mb-3 text-center">
							{period === '1d' ? '24 Hours' : period === '7d' ? '7 Days' : '30 Days'}
						</h3>

						{topMovers[period].length > 0 ? (
							<div className="space-y-2">
								{topMovers[period].map((mover, index) => (
									<div
										key={mover.name}
										className="flex items-center justify-between p-2 rounded bg-(--bg-main) hover:bg-(--primary-hover) transition-colors"
									>
										<div className="flex items-center gap-2 min-w-0 flex-1">
											<span className="text-xs text-(--text-secondary) font-medium w-4 shrink-0">#{index + 1}</span>
											<span className="text-sm font-medium text-(--text-primary) truncate">{mover.name}</span>
										</div>
										<div className="flex items-center gap-1 shrink-0 ml-2">
											<span className={`text-sm font-medium ${mover.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
												{mover.change >= 0 ? '+' : ''}
												{parseFloat(mover.change.toFixed(2))}%
											</span>
											<Icon
												name={mover.change >= 0 ? 'chevron-up' : 'chevron-down'}
												height={16}
												width={16}
												className={`${mover.change >= 0 ? 'text-green-600' : 'text-red-600'} shrink-0`}
											/>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-4">
								<Icon
									name="bar-chart"
									height={24}
									width={24}
									className="mx-auto mb-2 text-(--text-secondary) opacity-50"
								/>
								<p className="text-sm text-(--text-secondary)">No movers found</p>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
