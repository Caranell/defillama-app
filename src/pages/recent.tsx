import { RecentProtocols } from '~/containers/RecentProtocols'
import { maxAgeForNext } from '~/api'
import { getSimpleProtocolsPageData } from '~/api/categories/protocols'
import { basicPropertiesToKeep } from '~/api/categories/protocols/utils'
import { FORK_API } from '~/constants'
import { withPerformanceLogging } from '~/utils/perf'
import { fetchJson } from '~/utils/async'

export const getStaticProps = withPerformanceLogging('recent', async () => {
	const protocolsRaw = await getSimpleProtocolsPageData([...basicPropertiesToKeep, 'extraTvl', 'listedAt', 'chainTvls'])
	const { forks } = await fetchJson(FORK_API)

	const protocols = protocolsRaw.protocols.filter((p) => p.listedAt).sort((a, b) => b.listedAt - a.listedAt)
	const forkedList: { [name: string]: boolean } = {}

	Object.values(forks).map((list: string[]) => {
		list.map((f) => {
			forkedList[f] = true
		})
	})

	return {
		props: {
			protocols,
			chainList: protocolsRaw.chains,
			forkedList
		},
		revalidate: maxAgeForNext([22])
	}
})

export default function Protocols(props) {
	return (
		<RecentProtocols
			title="Recently Listed Protocols - DefiLlama"
			name="Recent"
			header="Recently Listed Protocols"
			{...props}
		/>
	)
}
