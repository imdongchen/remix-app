import { verifySessionStorage } from '#app/utils/verification.server'
import { invariant } from '@epic-web/invariant'
import { redirect } from '@remix-run/node'
import type { VerifyFunctionArgs } from './verify'

export const onboardingEmailSessionKey = 'onboardingEmail'

export async function handleVerification({ submission }: VerifyFunctionArgs) {
	invariant(submission.value, 'submission.value should be defined by now')
	const verifySession = await verifySessionStorage.getSession()
	verifySession.set(onboardingEmailSessionKey, submission.value.target)
	return redirect('/onboarding', {
		headers: {
			'set-cookie': await verifySessionStorage.commitSession(verifySession),
		},
	})
}

export const loader = () => {
	return redirect('/onboarding/profile')
}
