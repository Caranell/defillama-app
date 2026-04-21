const STORAGE_KEY = 'signup_source'

export const SIGNUP_SOURCES = {
	SUBSCRIPTION_PAGE: 'subscription-page',
	PRO_DASHBOARD: 'pro-dashboard',
	ADD_TO_DASHBOARD: 'add-to-dashboard',
	OPEN_IN_DASHBOARD: 'open-in-dashboard',
	CSV: 'csv',
	DOWNLOADS: 'downloads',
	SHEETS: 'sheets',
	SHEETS_AUTH: 'sheets-auth',
	CUSTOM_COLUMNS: 'custom-columns',
	YIELD_COLUMNS: 'yield-columns',
	YIELD_SCORE: 'yield-score',
	PROTOCOL_COMPARISON: 'protocol-comparison',
	CEX_INFLOWS: 'cex-inflows',
	WATCHLIST: 'watchlist',
	LLAMAAI: 'llamaai',
	LLAMAAI_PDF: 'llamaai-pdf',
	LLAMAAI_CHAT: 'llamaai-chat',
	LLAMAAI_SHARED: 'llamaai-shared',
	TOKEN_USAGE: 'token-usage',
	LIQUIDATIONS: 'liquidations',
	ENTITY_QUESTIONS: 'entity-questions',
	NAV_ACCOUNT: 'nav-account',
	ACCOUNT_ACCESS: 'account-access',
	API_CARD: 'api-card',
	PRO_CARD: 'pro-card',
	PAYMENT_BUTTON: 'payment-button'
} as const

export type SignupSource = (typeof SIGNUP_SOURCES)[keyof typeof SIGNUP_SOURCES]

const DEFAULT_SOURCE: SignupSource = SIGNUP_SOURCES.SUBSCRIPTION_PAGE

export function setSignupSource(source: SignupSource) {
	try {
		sessionStorage.setItem(STORAGE_KEY, source)
	} catch {
		// ignore storage errors
	}
}

export function setSignupSourceIfEmpty(source: SignupSource) {
	try {
		if (sessionStorage.getItem(STORAGE_KEY)) return
		sessionStorage.setItem(STORAGE_KEY, source)
	} catch {
		// ignore storage errors
	}
}

export function getSignupSource(): SignupSource {
	try {
		return (sessionStorage.getItem(STORAGE_KEY) as SignupSource | null) ?? DEFAULT_SOURCE
	} catch {
		return DEFAULT_SOURCE
	}
}

export function clearSignupSource() {
	try {
		sessionStorage.removeItem(STORAGE_KEY)
	} catch {
		// ignore storage errors
	}
}
