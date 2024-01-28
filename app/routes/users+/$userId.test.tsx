/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker'
import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '@testing-library/react'
import setCookieParser from 'set-cookie-parser'
import { test } from 'vitest'
import { loader as rootLoader } from '#app/root.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { createUser, getUserImages } from '#tests/db-utils.ts'
import { default as UsernameRoute, loader } from './$userId.tsx'

test('The user profile when not logged in as self', async () => {
	const user = await prisma.user.create({
		select: { id: true, firstName: true, lastName: true },
		data: { ...createUser() },
	})
	const App = createRemixStub([
		{
			path: '/users/:userId',
			Component: UsernameRoute,
			loader,
		},
	])

	const routeUrl = `/users/${user.id}`
	render(<App initialEntries={[routeUrl]} />)
	const userDisplayName = `${user.firstName} ${user.lastName}`

	await screen.findByRole('heading', { level: 1, name: userDisplayName })
	await screen.findByRole('link', { name: `${userDisplayName}'s notes` })
})

test('The user profile when logged in as self', async () => {
	const user = await prisma.user.create({
		select: { id: true, firstName: true, lastName: true },
		data: { ...createUser() },
	})
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
	const parsedCookie = setCookieParser.parseString(setCookieHeader)
	const cookieHeader = new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()

	const App = createRemixStub([
		{
			id: 'root',
			path: '/',
			loader: async args => {
				// add the cookie header to the request
				args.request.headers.set('cookie', cookieHeader)
				return rootLoader(args)
			},
			children: [
				{
					path: 'users/:userId',
					Component: UsernameRoute,
					loader: async args => {
						// add the cookie header to the request
						args.request.headers.set('cookie', cookieHeader)
						return loader(args)
					},
				},
			],
		},
	])

	const routeUrl = `/users/${user.id}`
	render(<App initialEntries={[routeUrl]} />)

	const userDisplayName = `${user.firstName} ${user.lastName}`

	await screen.findByRole('heading', { level: 1, name: userDisplayName! })
	await screen.findByRole('button', { name: /logout/i })
	await screen.findByRole('link', { name: /my notes/i })
	await screen.findByRole('link', { name: /edit profile/i })
})
