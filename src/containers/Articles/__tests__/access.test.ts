import { describe, expect, it } from 'vitest'
import type { AuthModel } from '~/utils/pocketbase'
import {
	RESEARCH_ACCESS_REDIRECT_PATH,
	canEditResearchArticle,
	canManageResearchArticle,
	hasResearchAccess,
	isResearcher,
	resolveArticlesGateState
} from '../ArticlesAccessGate'
import type { ArticleDocument } from '../types'

const user = (flags: AuthModel['flags'] = {}, id = 'viewer-id') =>
	({
		id,
		flags
	}) as AuthModel

const article = (overrides: Partial<ArticleDocument> = {}) =>
	({
		id: 'article-id',
		viewerRole: undefined,
		authorProfile: {
			pbUserId: 'owner-id'
		},
		...overrides
	}) as ArticleDocument

describe('research access helpers', () => {
	it('redirects denied research tool access back to the public research page', () => {
		expect(RESEARCH_ACCESS_REDIRECT_PATH).toBe('/research')
	})

	it('allows only researchers into research tools', () => {
		expect(hasResearchAccess(user({ is_llama: true }))).toBe(false)
		expect(hasResearchAccess(user({ is_researcher: true }))).toBe(true)
		expect(hasResearchAccess(user({}))).toBe(false)
	})

	it('uses only is_researcher for superuser access', () => {
		expect(isResearcher(user({ is_researcher: true }))).toBe(true)
		expect(isResearcher(user({ articleAdmin: true }))).toBe(false)
		expect(isResearcher(user({ is_llama: true }))).toBe(false)
	})

	it('lets researchers edit any public article chip target', () => {
		expect(
			canEditResearchArticle({
				article: article(),
				isAuthenticated: true,
				user: user({ is_researcher: true }, 'researcher-id')
			})
		).toBe(true)
	})

	it('does not show edit access for unrelated llama users without a role', () => {
		expect(
			canEditResearchArticle({
				article: article(),
				isAuthenticated: true,
				user: user({ is_llama: true }, 'other-id')
			})
		).toBe(false)
	})

	it('does not show edit access for owners without researcher access', () => {
		expect(
			canEditResearchArticle({
				article: article({ viewerRole: 'owner' }),
				isAuthenticated: true,
				user: user({}, 'owner-id')
			})
		).toBe(false)
	})

	it('treats researcher viewer role as full editor management capability', () => {
		expect(canManageResearchArticle(article({ viewerRole: 'researcher' }))).toBe(true)
		expect(canManageResearchArticle(article({ viewerRole: 'owner' }))).toBe(true)
		expect(canManageResearchArticle(article({ viewerRole: 'collaborator' }))).toBe(false)
	})
})

describe('resolveArticlesGateState', () => {
	it('waits during the client hydration gap instead of redirecting', () => {
		expect(resolveArticlesGateState({ isClient: false, isLoading: false, hasAccess: false })).toBe('loading')
	})

	it('waits while auth is still loading', () => {
		expect(resolveArticlesGateState({ isClient: true, isLoading: true, hasAccess: false })).toBe('loading')
	})

	it('redirects only once hydrated and resolved without access', () => {
		expect(resolveArticlesGateState({ isClient: true, isLoading: false, hasAccess: false })).toBe('redirect')
	})

	it('authorizes a resolved researcher', () => {
		expect(resolveArticlesGateState({ isClient: true, isLoading: false, hasAccess: true })).toBe('authorized')
	})
})
