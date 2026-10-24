import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GenerateView } from './GenerateView'

const notes = 'The cell membrane regulates substances entering and leaving a cell. The nucleus contains DNA and controls cell activities. Mitochondria produce ATP through cellular respiration.'
const draft = { title: 'Cells', subject: 'Biology', description: 'Cell functions', cards: [{ term: 'Nucleus', definition: 'Contains DNA', note: '' }, { term: 'Membrane', definition: 'Regulates entry and exit', note: '' }] }
describe('image upload to editable cards', () => {
  beforeEach(() => { history.replaceState(null, '', '/'); sessionStorage.setItem('open-source-ed.openrouter.session-key', 'test-key') })
  afterEach(() => { vi.unstubAllGlobals(); sessionStorage.clear() })
  it('keeps a successful photo when another fails and passes its text into generation', async () => {
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith('/models')) return new Response(JSON.stringify({ data: [] }))
      if (url.endsWith('/health')) return new Response('{}')
      const body = JSON.parse(String(options?.body))
      return new Response(JSON.stringify({ choices: [{ message: { content: body.response_format ? JSON.stringify(draft) : notes } }] }))
    })
    vi.stubGlobal('fetch', fetcher)
    const onDraft = vi.fn()
    render(<GenerateView onDraft={onDraft} />)
    fireEvent.change(screen.getByLabelText('Upload resource files'), { target: { files: [new File(['photo'], 'notes.png', { type: 'image/png' }), new File(['gif'], 'bad.gif', { type: 'image/gif' })] } })
    await waitFor(() => expect(screen.getByLabelText(/paste source material/i)).toHaveValue(`Image source: notes.png\n${notes}`))
    expect(screen.getByRole('alert')).toHaveTextContent('bad.gif')
    fireEvent.change(screen.getByLabelText(/what are you studying/i), { target: { value: 'Cells' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate editable cards/ }))
    await waitFor(() => expect(onDraft).toHaveBeenCalledTimes(1))
    expect(onDraft.mock.calls[0][1]).toEqual(['notes.png'])
    expect(onDraft.mock.calls[0][0].cards).toHaveLength(2)
    const last = JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))
    expect(last.messages[1].content).toContain(notes)
    expect(last.model).toBe('openrouter/free')
  })
})
