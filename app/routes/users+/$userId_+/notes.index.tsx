import { type MetaFunction } from '@remix-run/react'
import { getUserFullName } from '#app/utils/user.ts'

import { type loader as notesLoader } from './notes.tsx'

export default function NotesIndexRoute() {
	return (
		<div className="container pt-12">
			<p className="text-body-md">Select a note</p>
		</div>
	)
}

export const meta: MetaFunction<
	null,
	{ 'routes/users+/$userId+/notes': typeof notesLoader }
> = ({ matches }) => {
	const notesMatch = matches.find(m => m.id === 'routes/users+/$userId+/notes')
	const displayName = getUserFullName(notesMatch?.data?.owner)
	const noteCount = notesMatch?.data?.owner.notes.length ?? 0
	const notesText = noteCount === 1 ? 'note' : 'notes'
	return [
		{ title: `${displayName}'s Notes | Epic Notes` },
		{
			name: 'description',
			content: `Checkout ${displayName}'s ${noteCount} ${notesText} on Epic Notes`,
		},
	]
}
