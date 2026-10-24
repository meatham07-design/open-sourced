import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoSet } from '../data/demo'
import { Flashcards } from './Flashcards'
import { MatchMode } from './MatchMode'
import { MockTest } from './MockTest'
import { WriteMode } from './WriteMode'
const set = { ...demoSet, cards: demoSet.cards.slice(0, 3) }
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
describe('study mode completion', () => {
  it('flips, advances, wraps and shuffles flashcards', () => {
    render(<Flashcards set={set} back={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Flip' }))
    expect(screen.getByRole('button', { name: 'Read answer aloud' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Read term aloud' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle cards' }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })
  it('recovers from a mismatch, completes all pairs and starts a new round', () => {
    vi.useFakeTimers()
    const answer = vi.fn()
    render(<MatchMode set={set} answer={answer} back={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: set.cards[0].term }))
    fireEvent.click(screen.getByRole('button', { name: set.cards[1].definition }))
    expect(screen.getByText(/Not that pair/)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(700))
    for (const card of set.cards) {
      fireEvent.click(screen.getByRole('button', { name: card.term }))
      fireEvent.click(screen.getByRole('button', { name: card.definition }))
    }
    expect(screen.getByText('You matched 3 pairs with 1 miss.')).toBeInTheDocument()
    expect(answer).toHaveBeenCalledTimes(3)
    fireEvent.click(screen.getByRole('button', { name: 'Another round' }))
    expect(screen.getByText('0 / 3 pairs')).toBeInTheDocument()
  })
  it('grades a complete test once and shows the results', () => {
    const finish = vi.fn()
    render(<MockTest set={set} finish={finish} back={vi.fn()} />)
    for (const card of set.cards) {
      const question = screen.getByRole('heading', { name: card.term }).closest('article')!
      fireEvent.click(within(question).getByRole('radio', { name: new RegExp(card.definition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))
    }
    fireEvent.click(screen.getByRole('button', { name: 'Submit test' }))
    expect(screen.getByRole('heading', { name: '3 / 3' })).toBeInTheDocument()
    expect(finish).toHaveBeenCalledTimes(1)
    expect(finish.mock.calls[0].slice(0, 2)).toEqual([3, 3])
  })
  it('can cancel incomplete test submission', () => {
    const finish = vi.fn(); vi.stubGlobal('confirm', vi.fn(() => false))
    render(<MockTest set={set} finish={finish} back={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit test' }))
    expect(finish).not.toHaveBeenCalled()
    expect(screen.getByText('0 / 3 answered')).toBeInTheDocument()
  })
  it('finishes written recall for every card', () => {
    const answer = vi.fn()
    render(<WriteMode set={set} progress={{}} answer={answer} back={vi.fn()} />)
    for (const card of set.cards) {
      fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: card.definition } })
      fireEvent.click(screen.getByRole('button', { name: 'Check answer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Count as correct' }))
    }
    expect(answer).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('heading', { name: 'Writing session complete' })).toBeInTheDocument()
  })
})
