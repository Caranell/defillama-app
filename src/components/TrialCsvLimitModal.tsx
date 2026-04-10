import * as Ariakit from '@ariakit/react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useReducer, useState } from 'react'
import toast from 'react-hot-toast'
import { Icon } from '~/components/Icon'
import { useAuthContext } from '~/containers/Subscription/auth'
import { useSubscribe } from '~/containers/Subscription/useSubscribe'

type Step = 'initial' | 'verifying' | 'upgraded' | 'failed'

type Action = { type: 'setVerifying' } | { type: 'setUpgraded' } | { type: 'setStuck' } | { type: 'reset' }

function reducer(step: Step, action: Action): Step {
	switch (action.type) {
		case 'setVerifying':
			return 'verifying'
		case 'setUpgraded':
			return 'upgraded'
		case 'setStuck':
			return 'failed'
		case 'reset':
			return 'initial'
		default:
			return step
	}
}

const FEATURES = [
	'Unlimited CSV downloads',
	'Unlimited data exports',
	'5 deep research reports per day',
	'Custom dashboards & alerts'
]

export function TrialCsvLimitModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const { isTrial } = useAuthContext()!
	const queryClient = useQueryClient()
	const { endTrialSubscription, isEndTrialLoading, getPortalSessionUrl } = useSubscribe()
	const [step, dispatch] = useReducer(reducer, 'initial')
	const [verifyReady, setVerifyReady] = useState(false)

	const handleUpgrade = useCallback(async () => {
		try {
			await endTrialSubscription()
			dispatch({ type: 'setVerifying' })
		} catch {
			dispatch({ type: 'setStuck' })
		}
	}, [endTrialSubscription])

	const handleClose = useCallback(() => {
		dispatch({ type: 'reset' })
		onClose()
	}, [onClose])

	const handleOpenBillingPortal = useCallback(async () => {
		try {
			const portalUrl = await getPortalSessionUrl()
			if (portalUrl) {
				window.location.href = portalUrl
			}
		} catch {
			toast.error('Failed to open billing portal. Please try again.')
		}
	}, [getPortalSessionUrl])

	// Wait 3 seconds after API call, then refetch auth status
	useEffect(() => {
		if (step !== 'verifying') {
			setVerifyReady(false)
			return
		}

		let cancelled = false
		const timer = setTimeout(async () => {
			await queryClient.refetchQueries({ queryKey: ['auth', 'status'] })
			if (!cancelled) setVerifyReady(true)
		}, 3000)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [step, queryClient])

	// Once refetch completes, check if still on trial
	useEffect(() => {
		if (step !== 'verifying' || !verifyReady) return

		if (!isTrial) {
			dispatch({ type: 'setUpgraded' })
		} else {
			dispatch({ type: 'setStuck' })
		}
	}, [step, verifyReady, isTrial])

	return (
		<Ariakit.Dialog
			open={isOpen}
			onClose={handleClose}
			className="dialog flex max-h-[90dvh] max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl max-sm:drawer max-sm:rounded-b-none dark:border-[#39393E] dark:bg-[#1a1b1f] dark:text-white"
			portal
			unmountOnHide
		>
			{step === 'initial' && (
				<>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--sub-brand-primary)/10">
								<Icon name="download-paper" height={20} width={20} className="text-(--sub-brand-primary)" />
							</div>
							<h3 className="text-lg font-semibold">CSV Downloads Requires Pro</h3>
						</div>
						<button
							onClick={handleClose}
							className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-[#8a8c90] dark:hover:bg-[#39393E] dark:hover:text-white"
						>
							<Icon name="x" height={18} width={18} />
						</button>
					</div>

					<p className="text-sm text-gray-500 dark:text-[#8a8c90]">
						You're currently on a trial plan. Upgrade to export data from any chart or table across DefiLlama.
					</p>

					<div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-[#39393E] dark:bg-[#242529]">
						<p className="mb-2.5 text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-[#8a8c90]">
							Included with Pro
						</p>
						<ul className="space-y-2">
							{FEATURES.map((feature) => (
								<li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-[#c5c5c7]">
									<Icon name="check" height={14} width={14} className="shrink-0 text-(--sub-brand-primary)" />
									{feature}
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
						<div className="flex items-start gap-2.5">
							<Icon name="alert-triangle" height={16} width={16} className="mt-0.5 shrink-0 text-yellow-500" />
							<p className="text-sm text-gray-600 dark:text-[#c5c5c5]">
								Upgrading will end your free trial and you&apos;ll be charged $49/month immediately.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-2.5">
						<button
							onClick={() => void handleUpgrade()}
							disabled={isEndTrialLoading}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--sub-brand-primary) px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--sub-brand-primary)/90 disabled:cursor-not-allowed disabled:opacity-70"
						>
							<Icon name="sparkles" height={16} width={16} />
							{isEndTrialLoading ? 'Processing...' : 'Upgrade to Pro'}
						</button>
						<a
							href="/subscription"
							className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-[#39393E] dark:text-[#8a8c90] dark:hover:bg-[#2a2b30] dark:hover:text-white"
						>
							View all plans
						</a>
					</div>
				</>
			)}

			{step === 'verifying' && (
				<div className="flex flex-col items-center gap-4 py-4">
					<div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-(--sub-brand-primary) dark:border-[#39393E] dark:border-t-(--sub-brand-primary)" />
					<div className="text-center">
						<h3 className="text-lg font-semibold">Processing Upgrade...</h3>
						<p className="mt-1 text-sm text-gray-500 dark:text-[#8a8c90]">
							Verifying your subscription status. This may take a moment.
						</p>
					</div>
				</div>
			)}

			{step === 'upgraded' && (
				<div className="flex flex-col items-center gap-6">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--sub-brand-primary)/10">
						<Icon name="check" height={32} width={32} className="text-(--sub-brand-primary)" />
					</div>
					<div className="flex flex-col gap-2 text-center">
						<h3 className="text-xl font-semibold">Upgrade Successful!</h3>
						<p className="text-sm text-gray-500 dark:text-[#c5c5c5]">
							Your subscription has been activated. You now have full access to CSV downloads and all Pro features.
						</p>
					</div>
					<button
						onClick={handleClose}
						className="flex h-10 w-full items-center justify-center rounded-lg bg-(--sub-brand-primary) text-sm font-medium text-white transition-colors hover:bg-(--sub-brand-primary)/90"
					>
						Close
					</button>
				</div>
			)}

			{step === 'failed' && (
				<div className="flex flex-col items-center gap-4">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
						<Icon name="alert-triangle" height={28} width={28} className="text-yellow-500" />
					</div>
					<div className="flex flex-col gap-2 text-center">
						<h3 className="text-xl font-semibold">Failed to Upgrade</h3>
						<p className="text-sm text-gray-500 dark:text-[#c5c5c5]">
							There was an issue with your upgrade. Please check your Stripe billing portal or contact our support team
							for assistance (support@defillama.com).
						</p>
					</div>
					<div className="flex w-full flex-col gap-2.5">
						<button
							onClick={() => void handleOpenBillingPortal()}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--sub-brand-primary) px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--sub-brand-primary)/90"
						>
							Check Stripe Billing
						</button>
						<a
							href="mailto:support@defillama.com"
							className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-[#39393E] dark:text-[#8a8c90] dark:hover:bg-[#2a2b30] dark:hover:text-white"
						>
							Contact Support
						</a>
					</div>
				</div>
			)}
		</Ariakit.Dialog>
	)
}
