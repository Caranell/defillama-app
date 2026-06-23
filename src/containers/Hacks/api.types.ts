export interface IHackApiItem {
	date: number | null
	name: string
	classification: string | null
	technique: string | null
	amount: number | null
	chain: string[] | null
	bridgeHack: boolean
	targetType: string | null
	returnedFunds: number | null
	defillamaId: string | null
	language: string | null
	source?: string
	parentProtocolId?: string
}
