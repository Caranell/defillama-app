export const RECOVERY_GRACE_MS = 20000
// An agentic run can take minutes server-side. While the server confirms the run is
// still alive (or just completed with a result still landing), we keep recovering up
// to this hard ceiling instead of abandoning it at the short grace window.
export const RECOVERY_MAX_MS = 300000
export const RECOVERY_ATTEMPT_DELAYS_MS = [0, 1000, 2000, 4000, 8000, 14000] as const

export interface RecoveryActiveSnapshot {
	active: boolean
	status?: string
	hasResult?: boolean
}

// Decide whether to stop recovering a dropped stream. A flat wall-clock grace abandons
// long runs prematurely and surfaces a false "network error" while the answer is still
// being produced or persisted server-side. Gate give-up on server truth instead:
//   - run still running, or completed with a result still landing -> keep going to the ceiling
//   - server state unknown/failed (evicted execution, failed probe) -> fall back to the grace window
export function shouldGiveUpRecovery(snapshot: RecoveryActiveSnapshot | null, elapsedMs: number): boolean {
	if (snapshot?.active) {
		return elapsedMs >= RECOVERY_MAX_MS
	}
	if (snapshot?.status === 'completed' && snapshot.hasResult === true) {
		return elapsedMs >= RECOVERY_MAX_MS
	}
	return elapsedMs >= RECOVERY_GRACE_MS
}

export const CONNECTIVITY_ERROR_PATTERNS = [
	'failed to fetch',
	'networkerror',
	'network error',
	'load failed',
	'err_network_changed',
	'network changed',
	'err_name_not_resolved',
	'name not resolved',
	'stream heartbeat timeout',
	'stream ended without done event',
	'http error status: 502',
	'http error status: 503',
	'http error status: 504',
	'bad gateway',
	'service unavailable',
	'gateway timeout'
] as const

export function getRecoveryErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message
	return String(error)
}

export function isTemporaryConnectivityError(error: unknown): boolean {
	if (typeof navigator !== 'undefined' && navigator.onLine === false) {
		return true
	}

	const message = getRecoveryErrorMessage(error).toLowerCase()
	return CONNECTIVITY_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}
