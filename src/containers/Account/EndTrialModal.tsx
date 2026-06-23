import * as Ariakit from '@ariakit/react'
import { useCallback, useState } from 'react'
import { Icon } from '~/components/Icon'
import { useSubscribe } from '~/containers/Subscription/useSubscribe'

const DEFAULT_BENEFITS = [
	'Unlimited CSV downloads',
	'Unlimited AI questions',
	'5 deep research questions per day',
	'All Pro features without limitations'
]

interface EndTrialModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	description?: string
	benefitsTitle?: string
	benefits?: string[]
	confirmLabel?: string
	secondaryHref?: string
	secondaryLabel?: string
	/** When provided, the parent owns the upgrade action + loading state. When omitted, the modal self-calls endTrialSubscription() and shows its own success state. */
	onConfirm?: () => void
	isLoading?: boolean
}

export function EndTrialModal({
	isOpen,
	onClose,
	title = 'Upgrade to Full Access',
	description,
	benefitsTitle = 'Benefits of converting now:',
	benefits = DEFAULT_BENEFITS,
	confirmLabel = 'Confirm & Upgrade Now',
	secondaryHref,
	secondaryLabel,
	onConfirm,
	isLoading: externalLoading
}: EndTrialModalProps) {
	const selfHandled = !onConfirm
	const { endTrialSubscription, isEndTrialLoading } = useSubscribe()
	const [upgraded, setUpgraded] = useState(false)

	const isLoading = selfHandled ? isEndTrialLoading : !!externalLoading

	const handleConfirm = useCallback(async () => {
		if (onConfirm) {
			onConfirm()
			return
		}
		try {
			await endTrialSubscription()
			setUpgraded(true)
		} catch (error) {
			console.error('Failed to upgrade:', error)
		}
	}, [onConfirm, endTrialSubscription])

	const handleClose = useCallback(() => {
		setUpgraded(false)
		onClose()
	}, [onClose])

	return (
		<Ariakit.Dialog
			open={isOpen}
			onClose={() => {
				if (!isLoading) handleClose()
			}}
			className="dialog flex max-h-[90dvh] max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl max-sm:drawer max-sm:rounded-b-none dark:border-[#39393E] dark:bg-[#1a1b1f] dark:text-white"
			portal
			unmountOnHide
		>
			<div className="flex items-center justify-between">
				<h3 className="text-xl font-bold">{upgraded ? 'Upgrade Successful' : title}</h3>
				<button
					onClick={handleClose}
					className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-[#8a8c90] dark:hover:bg-[#39393E] dark:hover:text-white"
				>
					<Icon name="x" height={18} width={18} />
				</button>
			</div>

			{upgraded ? (
				<>
					<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
						<div className="flex items-start gap-3">
							<Icon name="check" height={20} width={20} className="mt-0.5 shrink-0 text-green-500" />
							<p className="text-sm text-gray-600 dark:text-[#c5c5c5]">
								Please wait a few minutes and refresh the page after upgrading, the upgrade might take a few minutes to
								apply.
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="w-full rounded-lg bg-(--sub-brand-primary) px-4 py-3 font-medium text-white transition-colors hover:bg-(--sub-brand-primary)/90"
					>
						Close
					</button>
				</>
			) : (
				<>
					{description ? <p className="text-sm text-gray-500 dark:text-[#8a8c90]">{description}</p> : null}

					{/* Benefits */}
					<div className="mt-2 flex flex-col gap-2">
						<p className="text-sm text-gray-500 dark:text-[#8a8c90]">{benefitsTitle}</p>
						<ul className="flex flex-col gap-1 text-sm">
							{benefits.map((b) => (
								<li key={b} className="flex items-center gap-2">
									<Icon name="check" height={14} width={14} className="shrink-0 text-green-500 dark:text-green-400" />
									<span>{b}</span>
								</li>
							))}
						</ul>
					</div>

					{/* Warning — single source of truth for the instant-charge disclosure */}
					<div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
						<div className="flex items-start gap-3">
							<Icon name="alert-triangle" height={20} width={20} className="mt-0.5 shrink-0 text-yellow-500" />
							<p className="text-sm text-gray-600 dark:text-[#c5c5c5]">
								By upgrading, you will end your free trial early and be charged the full subscription amount ($49/month)
								immediately.
							</p>
						</div>
					</div>

					{/* Actions */}
					<div className="mt-2 flex flex-col gap-3">
						<button
							onClick={() => void handleConfirm()}
							disabled={isLoading}
							className="w-full rounded-lg bg-(--sub-brand-primary) px-4 py-3 font-medium text-white transition-colors hover:bg-(--sub-brand-primary)/90 disabled:cursor-not-allowed disabled:opacity-70"
						>
							{isLoading ? 'Processing...' : confirmLabel}
						</button>
						{secondaryHref ? (
							<a
								href={secondaryHref}
								className="w-full rounded-lg border border-gray-200 px-4 py-2 text-center text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-[#39393E] dark:text-[#8a8c90] dark:hover:bg-[#2a2b30] dark:hover:text-white"
							>
								{secondaryLabel ?? 'View all plans'}
							</a>
						) : (
							<button
								onClick={handleClose}
								disabled={isLoading}
								className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#39393E] dark:text-[#8a8c90] dark:hover:bg-[#2a2b30] dark:hover:text-white"
							>
								{secondaryLabel ?? 'Close'}
							</button>
						)}
					</div>
				</>
			)}
		</Ariakit.Dialog>
	)
}
