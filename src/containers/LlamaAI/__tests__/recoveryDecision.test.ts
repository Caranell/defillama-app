import { describe, expect, it } from 'vitest'
import { RECOVERY_GRACE_MS, RECOVERY_MAX_MS, shouldGiveUpRecovery } from '~/containers/LlamaAI/connectionErrors'

describe('shouldGiveUpRecovery', () => {
	const past = (ms: number) => ms + 1

	it('does NOT give up on a still-running execution past the short grace window', () => {
		// This is the core fix: a long run that drops mid-stream must keep recovering,
		// not surface a false "network error" 20s in while the server is still working.
		expect(shouldGiveUpRecovery({ active: true }, past(RECOVERY_GRACE_MS))).toBe(false)
	})

	it('gives up on a still-running execution only at the hard ceiling', () => {
		expect(shouldGiveUpRecovery({ active: true }, RECOVERY_MAX_MS - 1)).toBe(false)
		expect(shouldGiveUpRecovery({ active: true }, past(RECOVERY_MAX_MS))).toBe(true)
	})

	it('keeps waiting when the run completed with a result still landing', () => {
		const snap = { active: false, status: 'completed', hasResult: true }
		expect(shouldGiveUpRecovery(snap, past(RECOVERY_GRACE_MS))).toBe(false)
		expect(shouldGiveUpRecovery(snap, past(RECOVERY_MAX_MS))).toBe(true)
	})

	it('falls back to the short grace when completed but no result exists', () => {
		const snap = { active: false, status: 'completed', hasResult: false }
		expect(shouldGiveUpRecovery(snap, RECOVERY_GRACE_MS - 1)).toBe(false)
		expect(shouldGiveUpRecovery(snap, past(RECOVERY_GRACE_MS))).toBe(true)
	})

	it('uses the short grace for an evicted execution (bare active:false)', () => {
		expect(shouldGiveUpRecovery({ active: false }, RECOVERY_GRACE_MS - 1)).toBe(false)
		expect(shouldGiveUpRecovery({ active: false }, past(RECOVERY_GRACE_MS))).toBe(true)
	})

	it('uses the short grace when the active probe itself failed (null snapshot)', () => {
		expect(shouldGiveUpRecovery(null, RECOVERY_GRACE_MS - 1)).toBe(false)
		expect(shouldGiveUpRecovery(null, past(RECOVERY_GRACE_MS))).toBe(true)
	})

	it('does not give up on a failed-status run before the grace window', () => {
		expect(shouldGiveUpRecovery({ active: false, status: 'error' }, RECOVERY_GRACE_MS - 1)).toBe(false)
		expect(shouldGiveUpRecovery({ active: false, status: 'error' }, past(RECOVERY_GRACE_MS))).toBe(true)
	})
})
