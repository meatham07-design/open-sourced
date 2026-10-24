import { describe, expect, it } from 'vitest'
import { validateGeneratedSet } from './generatedSet'
const valid = { title: 'Cells', subject: 'Biology', description: '', cards: [{ term: 'Cell', definition: 'Unit of life' }, { term: 'Nucleus', definition: 'Contains DNA' }] }
describe('AI output validation', () => {
  it('accepts valid cards and supplies optional notes', () => expect(validateGeneratedSet(valid).cards[0].note).toBe(''))
  it.each([null, {}, { ...valid, cards: [] }, { ...valid, cards: [{ term: '', definition: 'x' }, valid.cards[1]] }])('rejects unusable drafts', (value) => expect(() => validateGeneratedSet(value)).toThrow(/incomplete/))
  it('enforces an exact requested count', () => expect(() => validateGeneratedSet(valid, 3)).toThrow(/requested 3/))
})
