import { conform, useForm } from '@conform-to/react'
import { ErrorList, Field } from '#app/components/forms'
import { Spacer } from '#app/components/spacer'
import { requireUserId } from '#app/utils/auth.server'
import { validateCSRF } from '#app/utils/csrf.server'
import { prisma } from '#app/utils/db.server'
import { checkHoneypot } from '#app/utils/honeypot.server'
import { useIsPending } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server'
import { useUser } from '#app/utils/user'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, useActionData, useSearchParams } from '@remix-run/react'
import { AuthenticityTokenInput } from 'remix-utils/csrf/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { z } from 'zod'
import { StatusButton } from '#app/components/ui/status-button'

const CompanyFormSchema = z.object({
	name: z.string(),
	addressLine1: z.string(),
	addressLine2: z.string().optional(),
	city: z.string(),
	state: z.string(),
	zipCode: z.string(),
	redirectTo: z.string().optional(),
})

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireUserId(request)
	return json({})
}

export const action = async ({ request }: ActionFunctionArgs) => {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	await validateCSRF(formData, request.headers)
	checkHoneypot(formData)

	const submission = parse(formData, {
		schema: CompanyFormSchema,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const { redirectTo, name, ...companyAddress } = submission.value
	await prisma.user.update({
		where: { id: userId },
		data: {
			roles: { connect: { name: 'admin' } },
			company: {
				create: {
					name,
					address: {
						create: { ...companyAddress, country: 'US' },
					},
				},
			},
		},
	})

	return redirectWithToast(safeRedirect(redirectTo), {
		title: 'Welcome',
		description: 'Thanks for signing up!',
	})
}

export default function Screen() {
	const user = useUser()
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const [form, fields] = useForm({
		id: 'onboarding-company-form',
		constraint: getFieldsetConstraint(CompanyFormSchema),
		defaultValue: { redirectTo },
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CompanyFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-lg">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome aboard {user.firstName}!</h1>
					<p className="text-body-md text-muted-foreground">
						Please enter your company info.
					</p>
				</div>
				<Spacer size="xs" />
				<Form
					method="POST"
					className="mx-auto min-w-full max-w-sm sm:min-w-[368px]"
					{...form.props}
				>
					<AuthenticityTokenInput />
					<HoneypotInputs />
					<Field
						labelProps={{
							htmlFor: fields.name.id,
							children: 'Company Name',
						}}
						inputProps={{
							...conform.input(fields.name),
							autoComplete: 'off',
						}}
						errors={fields.name.errors}
					/>
					<Field
						labelProps={{
							htmlFor: fields.addressLine1.id,
							children: 'Address Line 1',
						}}
						inputProps={{
							...conform.input(fields.addressLine1),
							autoComplete: 'address-line1',
						}}
						errors={fields.addressLine1.errors}
					/>
					<Field
						labelProps={{
							htmlFor: fields.addressLine2.id,
							children: 'Address Line 2',
						}}
						inputProps={{
							...conform.input(fields.addressLine2),
							autoComplete: 'address-line2',
						}}
						errors={fields.addressLine2.errors}
					/>
					<Field
						labelProps={{
							htmlFor: fields.city.id,
							children: 'City',
						}}
						inputProps={{
							...conform.input(fields.city),
							autoComplete: 'city',
						}}
						errors={fields.city.errors}
					/>
					<Field
						labelProps={{
							htmlFor: fields.state.id,
							children: 'State',
						}}
						inputProps={{
							...conform.input(fields.state),
							autoComplete: 'state',
						}}
						errors={fields.state.errors}
					/>
					<Field
						labelProps={{
							htmlFor: fields.zipCode.id,
							children: 'Zip Code',
						}}
						inputProps={{
							...conform.input(fields.zipCode),
							autoComplete: 'postal-code',
						}}
						errors={fields.zipCode.errors}
					/>

					<input {...conform.input(fields.redirectTo, { type: 'hidden' })} />
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="flex items-center justify-between gap-6">
						<StatusButton
							className="w-full"
							status={isPending ? 'pending' : actionData?.status ?? 'idle'}
							type="submit"
							disabled={isPending}
						>
							Continue
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}
