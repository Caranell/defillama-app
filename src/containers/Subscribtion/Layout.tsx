import Head from 'next/head'
import { useState } from 'react'
import * as Ariakit from '@ariakit/react'
import { useAccount } from 'wagmi'
import { Icon } from '~/components/Icon'
import { BasicLink } from '~/components/Link'
import { LinkPreviewCard } from '~/components/SEO'
import { Toast } from '~/components/Toast'
import { useAuthContext } from '~/containers/Subscribtion/auth'
import { formatEthAddress } from '~/utils'
import { SignIn } from './SignIn'

export function SubscribeLayout({ children }) {
	const { isAuthenticated, logout, user } = useAuthContext()
	const { address } = useAccount()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	const displayAddress = user?.walletAddress || address
	const userEmail = user?.email && !user.email.includes('@defillama.com') ? user.email : null

	return (
		<>
			<Head>
				<title>Subscribe - DefiLlama</title>
				<link rel="icon" type="image/png" href="/favicon-32x32.png" />
			</Head>
			<LinkPreviewCard />
			<div className="col-span-full flex min-h-screen w-full flex-col bg-[#13141a] text-white">
				<header className="sticky top-0 z-50 border-b border-[#39393E]/40 bg-[#13141a]/80 backdrop-blur-md">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 xl:max-w-7xl 2xl:max-w-[1440px]">
						<BasicLink href="/" className="flex items-center gap-3">
							<img src="/icons/llama.webp" alt="DefiLlama" width={32} height={32} className="rounded-full" />
							<span className="hidden text-lg font-bold sm:inline-block">DefiLlama</span>
						</BasicLink>

						<div className="flex items-center gap-4">
							{!isAuthenticated ? (
								<SignIn className="flex items-center gap-2 rounded-lg bg-[#5C5CF9] px-4 py-2 font-medium text-white shadow-md transition-all duration-200 hover:bg-[#4A4AF0]" />
							) : (
								<Ariakit.MenuProvider open={isMenuOpen} setOpen={setIsMenuOpen}>
									<Ariakit.MenuButton className="flex items-center gap-2 rounded-lg border border-[#39393E] bg-[#1a1b1f] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-[#5C5CF9]">
										<Icon name="wallet" height={16} width={16} className="text-[#5C5CF9]" />
										<span className="hidden sm:inline">{displayAddress ? formatEthAddress(displayAddress) : userEmail || 'Account'}</span>
										<Icon name="chevron-down" height={14} width={14} />
									</Ariakit.MenuButton>
									<Ariakit.Menu className="z-50 min-w-[200px] rounded-lg border border-[#39393E] bg-[#1a1b1f] p-2 shadow-xl">
										<Ariakit.MenuItem
											className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#b4b7bc] transition-colors hover:bg-[#39393E] hover:text-white focus:outline-none"
											render={<BasicLink href="/" />}
										>
											<Icon name="home" height={16} width={16} />
											Return to Main Page
										</Ariakit.MenuItem>
										<Ariakit.MenuItem
											className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#b4b7bc] transition-colors hover:bg-[#39393E] hover:text-white focus:outline-none"
											onClick={logout}
										>
											<Icon name="log-out" height={16} width={16} />
											Logout
										</Ariakit.MenuItem>
									</Ariakit.Menu>
								</Ariakit.MenuProvider>
							)}
						</div>
					</div>
				</header>

				<main className="grow py-8">{children}</main>

				<footer className="mt-auto border-t border-[#39393E]/40 px-5 py-8">
					<div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px]">
						<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
							<div className="flex items-center gap-3">
								<img src="/icons/llama.webp" alt="DefiLlama" width={28} height={28} className="rounded-full" />
								<span className="font-bold">DefiLlama</span>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-6 text-[#8a8c90]">
								<a href="https://discord.defillama.com" className="transition-colors hover:text-white">
									Discord
								</a>
								<a href="https://twitter.com/DefiLlama" className="transition-colors hover:text-white">
									Twitter
								</a>
								<a href="https://github.com/DefiLlama" className="transition-colors hover:text-white">
									GitHub
								</a>
								<a href="mailto:support@defillama.com" className="transition-colors hover:text-white">
									Contact Us
								</a>
							</div>
						</div>

						<div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-[#39393E]/40 pt-6 text-xs text-[#8a8c90] md:justify-between">
							<div>© {new Date().getFullYear()} DefiLlama. All rights reserved.</div>
							<div className="flex flex-wrap items-center gap-4">
								<BasicLink href="/privacy-policy" className="transition-colors hover:text-white">
									Privacy Policy
								</BasicLink>

								<BasicLink href="/subscription/fulfillment-policies" className="transition-colors hover:text-white">
									Fulfillment Policies
								</BasicLink>

								<BasicLink href="/terms" className="transition-colors hover:text-white">
									Terms of Service
								</BasicLink>
							</div>
						</div>
					</div>
				</footer>
				<Toast />
			</div>
		</>
	)
}
