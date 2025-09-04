import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '~/layout'

async function submitSupportRequest(formData: FormData) {
	try {
		const data = await fetch(
			'https://api.llama.fi/reportSupport',
			{
				method: 'POST',
				body: formData
			}
		).then((res) => res.json())
		return data
	} catch (error) {
		throw new Error(error instanceof Error ? error.message : 'Failed to report')
	}
}

function Support() {
	const { mutateAsync, isPending, error } = useMutation({ mutationFn: submitSupportRequest })
	const [isSubmitted, setIsSubmitted] = React.useState(false)
	
	const onSubmit = async (e) => {
		e.preventDefault()

		const form = e.target as HTMLFormElement
		const formData = new FormData(form)

		// Remove the file field if no file is selected
		const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
		if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
			formData.delete('attachment')
		}

		mutateAsync(formData)
			.then((data) => {
				if (data?.message === 'success') {
					toast.success('Support request submitted successfully', { position: 'bottom-right' })
					form.reset()
					setIsSubmitted(true)
				} else {
					console.log(data)
					toast.error('Failed to submit support request', { position: 'bottom-right' })
				}
			})
			.catch((error) => {
				toast.error('Failed to submit support request', { position: 'bottom-right' })
			})
	}

	const SuccessScreen = () => (
		<div className="flex w-full flex-col gap-4 rounded-md border border-(--cards-border) bg-(--cards-bg) p-6 text-center">
			<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
				<svg
					className="h-8 w-8 text-green-600 dark:text-green-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
			<h1 className="text-2xl font-semibold text-green-600 dark:text-green-400">Success!</h1>
			<p className="text-gray-600 dark:text-gray-300">
				Your support request has been submitted successfully. We'll get back to you as soon as possible.
			</p>
			<button
				onClick={() => setIsSubmitted(false)}
				className="mt-4 rounded-md bg-(--link-active-bg) p-3 text-white hover:opacity-90"
			>
				Submit Another Request
			</button>
		</div>
	)

	return (
		<Layout
			title="Support - DefiLlama"
			description={`Get support from DefiLlama. DefiLlama is committed to providing accurate data without ads or sponsored content, as well as transparency.`}
			keywords={`defillama support, support from defillama`}
			canonicalUrl={`/support`}
		>
			<div className="mx-auto flex w-full max-w-lg flex-col gap-4 lg:mt-4 xl:mt-11">
				{isSubmitted ? (
					<SuccessScreen />
				) : (
					<form
						onSubmit={onSubmit}
						className="flex w-full flex-col gap-4 rounded-md border border-(--cards-border) bg-(--cards-bg) p-3"
					>
						<h1 className="mb-3 text-center text-xl font-semibold">Support</h1>
						<label className="flex flex-col gap-1">
							<span>Name</span>
							<input
								type="text"
								name="name"
								required
								className="rounded-md border border-(--form-control-border) bg-white p-2 text-black disabled:opacity-50 dark:bg-black dark:text-white"
							/>
						</label>

						<label className="flex flex-col gap-1">
							<span>Email</span>
							<input
								type="email"
								name="email"
								required
								className="rounded-md border border-(--form-control-border) bg-white p-2 text-black disabled:opacity-50 dark:bg-black dark:text-white"
							/>
						</label>

						<label className="flex flex-col gap-1">
							<span>Description</span>
							<textarea
								name="body"
								required
								className="rounded-md border border-(--form-control-border) bg-white p-2 text-black disabled:opacity-50 dark:bg-black dark:text-white"
							></textarea>
						</label>

						<button
							name="submit-btn"
							disabled={isPending}
							className="mt-3 rounded-md bg-(--link-active-bg) p-3 text-white disabled:opacity-50"
						>
							{isPending ? 'Submitting...' : 'Submit'}
						</button>
						{error && <small className="text-center text-red-500">{error.message}</small>}
					</form>
				)}
			</div>
		</Layout>
	)
}

export default Support
