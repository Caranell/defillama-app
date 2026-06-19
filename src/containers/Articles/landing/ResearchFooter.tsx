import Link from 'next/link'
import { type ChangeEvent, type FormEvent, useId, useState } from 'react'
import { Icon } from '~/components/Icon'
import { ResearchIcon } from '~/components/ResearchIcon'
import { FEATURES_SERVER } from '~/constants'
import { useNewsletterSubscription } from '~/hooks/useNewsletterSubscription'

const MEDIA_KIT_URL = `${FEATURES_SERVER.replace(/\/$/, '')}/uploads/media-kit.pdf`
const BRAND_KIT_URL = 'https://defillama.com/defillama-press-kit.zip'
const NEWSLETTER_URL =
	'https://newsletter.defillama.com/?utm_source=defillama&utm_medium=research&utm_campaign=research_footer'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterColumnDef = { title: string; links: FooterLink[] }

const SECTION_LINKS: FooterLink[] = [
	{ label: 'Reports', href: '/research/report' },
	{ label: 'Spotlights', href: '/research/spotlight' },
	{ label: 'Interviews', href: '/research/interview' },
	{ label: 'Opinion', href: '/research/opinion' },
	{ label: 'Roundtables', href: '/research/roundtables' }
]

const ABOUT_LINKS: FooterLink[] = [
	{ label: 'Research Center', href: '/research' },
	{ label: 'Contact us', href: 'mailto:research@defillama.com', external: true },
	{ label: 'Book a call', href: 'https://calendly.com/research-defillama/30min', external: true },
	{ label: 'Brand kit', href: BRAND_KIT_URL, external: true },
	{ label: 'Trusted by', href: '/research#clients' }
]

// Add a new column here (or push to the arrays above) and it renders in both the
// desktop grid and the mobile accordion automatically.
const FOOTER_COLUMNS: FooterColumnDef[] = [
	{ title: 'Sections', links: SECTION_LINKS },
	{ title: 'About us', links: ABOUT_LINKS }
]

const SOCIAL_LINKS = [
	{ name: 'x-social' as const, label: 'Follow DefiLlama Research on X', href: 'https://x.com/defillama_res' },
	{ name: 'telegram' as const, label: 'Join DefiLlama Research on Telegram', href: 'https://t.me/defillama_research' },
	{
		name: 'linkedin' as const,
		label: 'Follow DefiLlama on LinkedIn',
		href: 'https://www.linkedin.com/company/defillama/'
	},
	{ name: 'rss-feed' as const, label: 'Subscribe via RSS', href: '/research/feed' }
]

const LEGAL_LINKS: FooterLink[] = [
	{ label: 'Terms of Service', href: '/terms' },
	{ label: 'Privacy Policy', href: '/privacy-policy' },
	{ label: 'Sitemap', href: '/research/sitemap.xml', external: true }
]

const headingClassName = 'font-extrabold text-xs uppercase leading-tight tracking-widest text-(--text-primary)'
const linkClassName = 'font-medium text-sm leading-snug text-(--text-primary) transition-opacity hover:opacity-60'
const descriptionClassName = 'font-light text-sm leading-relaxed text-(--text-secondary)'
const legalTextClassName = 'font-light text-xs leading-tight text-(--text-tertiary)'
const legalLinkClassName = 'font-light text-xs leading-tight text-(--text-tertiary) transition-opacity hover:opacity-60'
const primaryButtonClassName =
	'flex h-10 items-center justify-center gap-2 rounded-full bg-(--link-text) px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90'

function FooterLinkItem({ link }: { link: FooterLink }) {
	if (link.external) {
		return (
			<a
				href={link.href}
				target={link.href.startsWith('mailto:') ? undefined : '_blank'}
				rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
				className={linkClassName}
			>
				{link.label}
			</a>
		)
	}
	return (
		<Link href={link.href} className={linkClassName}>
			{link.label}
		</Link>
	)
}

function FooterSocials() {
	const itemClassName = 'flex text-(--text-primary) transition-opacity hover:opacity-70'
	return (
		<ul className="flex items-center gap-3">
			{SOCIAL_LINKS.map((social) => (
				<li key={social.name}>
					{social.href.startsWith('/') ? (
						<Link href={social.href} aria-label={social.label} className={itemClassName}>
							<ResearchIcon name={social.name} width={30} height={30} aria-hidden />
						</Link>
					) : (
						<a
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={social.label}
							className={itemClassName}
						>
							<ResearchIcon name={social.name} width={30} height={30} aria-hidden />
						</a>
					)}
				</li>
			))}
		</ul>
	)
}

function FooterBrand({ className = '', wideDescription = false }: { className?: string; wideDescription?: boolean }) {
	return (
		<div className={`flex flex-col gap-5 ${className}`}>
			<Link
				href="/research"
				aria-label="DefiLlama Research home"
				className="inline-flex w-fit transition-opacity hover:opacity-80"
			>
				<img
					src="/assets/research_logo.webp"
					alt="DefiLlama Research"
					width={229}
					height={72}
					className="h-10 w-auto dark:hidden"
				/>
				<img
					src="/assets/research_logo_dark.webp"
					alt="DefiLlama Research"
					width={229}
					height={72}
					className="hidden h-10 w-auto dark:block"
				/>
			</Link>
			<p className={`${descriptionClassName} ${wideDescription ? '' : 'max-w-xs'}`}>
				Bespoke digital asset research, market intelligence, and strategic advisory services powered by the DefiLlama
				ecosystem.
			</p>
			<FooterSocials />
		</div>
	)
}

function FooterColumn({ title, links }: FooterColumnDef) {
	return (
		<nav aria-label={title} className="flex flex-col gap-4">
			<h2 className={headingClassName}>{title}</h2>
			<ul className="flex flex-col gap-2.5">
				{links.map((link) => (
					<li key={link.label}>
						<FooterLinkItem link={link} />
					</li>
				))}
			</ul>
		</nav>
	)
}

function FooterAccordion({ title, links }: FooterColumnDef) {
	const [open, setOpen] = useState(false)
	const panelId = useId()
	return (
		<div className="border-b border-(--cards-border)">
			<h2>
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					aria-expanded={open}
					aria-controls={panelId}
					className="flex w-full items-center justify-between gap-2 py-4 text-left"
				>
					<span className={headingClassName}>{title}</span>
					<Icon
						name="chevron-down"
						height={18}
						width={18}
						className={`shrink-0 text-(--text-tertiary) transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
					/>
				</button>
			</h2>
			<div
				id={panelId}
				className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}
			>
				<ul className="flex flex-col gap-3 pb-5">
					{links.map((link) => (
						<li key={link.label}>
							<FooterLinkItem link={link} />
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

function FooterNewsletter() {
	const mutation = useNewsletterSubscription()
	const [email, setEmail] = useState('')
	const [succeeded, setSucceeded] = useState(false)

	const isPending = mutation.isPending
	const canSubmit = !isPending && email.trim().length > 0

	const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!canSubmit) return
		// The email is captured on any successful response, so unlock the media kit
		// download as soon as the request succeeds. The hook owns the toast feedback
		// (success / partial / error), so we don't repeat it inline here.
		mutation.mutate(
			{ email: email.trim(), newsletters: ['newsletter', 'research'] },
			{ onSuccess: () => setSucceeded(true) }
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<h2 className={headingClassName}>Subscribe &amp; get our media kit</h2>
			<p className={`max-w-sm ${descriptionClassName}`}>
				Join DefiLlama Research and instantly unlock our full media kit.
			</p>
			{succeeded ? (
				<a href={MEDIA_KIT_URL} target="_blank" rel="noopener noreferrer" className={`${primaryButtonClassName} w-fit`}>
					<ResearchIcon name="research-media-kit" width={18} height={18} aria-hidden />
					Download media kit
				</a>
			) : (
				<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<input
						type="email"
						required
						aria-label="Email address"
						value={email}
						onChange={onEmailChange}
						placeholder="Email address"
						className="min-w-0 flex-1 appearance-none border-x-0 border-t-0 border-b border-(--cards-border) bg-transparent pb-2 text-sm text-(--text-primary) placeholder:text-(--text-tertiary) focus:border-(--link-text) focus:outline-none"
					/>
					<button
						type="submit"
						aria-busy={isPending}
						disabled={isPending}
						className={`${primaryButtonClassName} shrink-0 disabled:cursor-wait disabled:opacity-70`}
					>
						{isPending ? (
							<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							'Subscribe'
						)}
					</button>
				</form>
			)}
			<a
				href={NEWSLETTER_URL}
				target="_blank"
				rel="noopener noreferrer"
				className={`${headingClassName} group mt-1 inline-flex w-fit items-center gap-1.5 transition-opacity hover:opacity-60`}
			>
				DefiLlama newsletters
				<Icon
					name="arrow-right"
					height={14}
					width={14}
					className="transition-transform duration-200 group-hover:translate-x-0.5"
				/>
			</a>
		</div>
	)
}

function FooterLegalBar() {
	return (
		<div className="mt-10 flex flex-col items-center gap-4 border-t border-(--cards-border) pt-6 text-center sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:text-left">
			<p className={legalTextClassName}>© DefiLlama Research. All rights reserved.</p>
			<ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-start">
				{LEGAL_LINKS.map((link) => (
					<li key={link.label}>
						{link.external ? (
							<a href={link.href} className={legalLinkClassName}>
								{link.label}
							</a>
						) : (
							<Link href={link.href} className={legalLinkClassName}>
								{link.label}
							</Link>
						)}
					</li>
				))}
			</ul>
		</div>
	)
}

export function ResearchFooter({ maxWidthClassName = 'max-w-7xl' }: { maxWidthClassName?: string }) {
	return (
		<footer className="text-(--text-primary)">
			<div className={`mx-auto w-full ${maxWidthClassName} px-4 sm:px-6 lg:px-6`}>
				<div className="border-t border-(--cards-border) py-8">
					<div className="hidden md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-12 lg:grid-cols-[1.5fr_auto_2fr] lg:gap-12">
						<div className="order-1 col-span-2 lg:order-3 lg:col-span-1">
							<FooterNewsletter />
						</div>
						<FooterBrand className="order-2 lg:order-1" />
						<div className="order-3 flex flex-wrap gap-12 sm:gap-16 lg:order-2 lg:gap-12">
							{FOOTER_COLUMNS.map((col) => (
								<FooterColumn key={col.title} title={col.title} links={col.links} />
							))}
						</div>
					</div>

					<div className="flex flex-col md:hidden">
						<FooterNewsletter />
						<nav aria-label="Footer links" className="mt-8 border-t border-(--cards-border)">
							{FOOTER_COLUMNS.map((col) => (
								<FooterAccordion key={col.title} title={col.title} links={col.links} />
							))}
						</nav>
						<FooterBrand className="mt-6" wideDescription />
					</div>

					<FooterLegalBar />
				</div>
			</div>
		</footer>
	)
}
