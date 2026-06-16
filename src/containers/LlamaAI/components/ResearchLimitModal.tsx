import * as Ariakit from '@ariakit/react'
import { Icon } from '~/components/Icon'
import { BasicLink } from '~/components/Link'
import { EndTrialModal } from '~/containers/Account/EndTrialModal'
import { useAuthContext } from '~/containers/Subscription/auth'

interface ResearchLimitModalProps {
	dialogStore: Ariakit.DialogStore
	period: string
	limit: number
	resetTime: string | null
	feature?: 'research' | 'fact_checked'
}

const COPY = {
	research: {
		titleLimit: 'Research Report Limit Reached',
		bodyBlocked: 'Subscribe to Pro to use research reports.',
		bodyLifetime: (n: number) => `You've used all ${n} research reports available on your trial plan.`,
		bodyDaily: (n: number) => `You've used all ${n} research reports for today. Resets at midnight UTC.`,
		proPitch: 'Get 5 research reports per day with Pro',
		umamiUpgrade: 'subscribe-research-limit-upgrade'
	},
	fact_checked: {
		titleLimit: 'Fact-Checked Answer Limit Reached',
		bodyBlocked: 'Subscribe to Pro to use fact-checked answers.',
		bodyLifetime: (n: number) => `You've used all ${n} fact-checked answers available on your trial plan.`,
		bodyDaily: (n: number) => `You've used all ${n} fact-checked answers for today. Resets at midnight UTC.`,
		proPitch: 'Get 10 fact-checked answers per day with Pro',
		umamiUpgrade: 'subscribe-fact-checked-limit-upgrade'
	}
} as const

export function ResearchLimitModal({
	dialogStore,
	period,
	limit,
	resetTime: _resetTime,
	feature = 'research'
}: ResearchLimitModalProps) {
	const isLifetime = period === 'lifetime'
	const isBlocked = period === 'blocked'
	const { isTrial } = useAuthContext()
	const open = dialogStore.useState('open')

	const limitBody = isLifetime ? COPY[feature].bodyLifetime(limit) : COPY[feature].bodyDaily(limit)

	// Trial users converting to a paid plan get the shared, instant-charge modal.
	if (isTrial) {
		return (
			<EndTrialModal
				isOpen={open}
				onClose={dialogStore.hide}
				title={COPY[feature].titleLimit}
				description={isBlocked ? COPY[feature].bodyBlocked : limitBody}
				confirmLabel="Upgrade to Pro"
			/>
		)
	}

	return (
		<Ariakit.DialogProvider store={dialogStore}>
			<Ariakit.Dialog
				className="dialog fixed inset-0 z-50 m-auto h-fit w-full max-w-md overflow-hidden rounded-2xl border border-[#E6E6E6] bg-[#FFFFFF] p-0 shadow-xl dark:border-[#39393E] dark:bg-[#222429]"
				backdrop={<div className="backdrop fixed inset-0 bg-black/60 backdrop-blur-sm" />}
				portal
				unmountOnHide
			>
				<button
					type="button"
					onClick={dialogStore.hide}
					className="absolute top-4 right-4 z-20 rounded-full p-1.5 text-[#666] transition-colors hover:bg-[#f7f7f7] hover:text-black dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white"
				>
					<Icon name="x" className="size-5" />
				</button>

				<div className="relative z-10 px-8 py-10">
					<div className="mb-6 flex justify-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-[#FFF3E0] dark:bg-[#3D2F1F]">
							<Icon name="circle-x" height={32} width={32} className="text-[#FF9800]" />
						</div>
					</div>

					<h2 className="mb-4 text-center text-xl leading-snug font-bold text-black dark:text-white">
						{COPY[feature].titleLimit}
					</h2>
					<p className="mb-6 text-center text-base leading-6 text-[#666] dark:text-[#919296]">
						{isBlocked ? COPY[feature].bodyBlocked : limitBody}
					</p>

					{isBlocked ? (
						<>
							<BasicLink
								href="/subscription"
								data-umami-event={COPY[feature].umamiUpgrade}
								className="mx-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#5C5CF9] px-6 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-[#4A4AF0]"
								onClick={dialogStore.hide}
							>
								Upgrade to Pro
							</BasicLink>
							<p className="mt-4 text-center text-sm text-[#888] dark:text-[#777]">{COPY[feature].proPitch}</p>
						</>
					) : (
						// Already on a paid plan, just hit the daily cap — informational only, no upsell.
						<button
							type="button"
							onClick={dialogStore.hide}
							className="mx-auto flex w-full items-center justify-center gap-2 rounded-lg bg-[#5C5CF9] px-6 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-[#4A4AF0]"
						>
							Got it
						</button>
					)}
				</div>
			</Ariakit.Dialog>
		</Ariakit.DialogProvider>
	)
}
