import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { extractImageText } from './imageVision'

const photo = () => new File(['image bytes'], 'notes.png', { type: 'image/png' })
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
describe('image transcription', () => {
  beforeEach(() => sessionStorage.setItem('open-source-ed.openrouter.session-key', 'test-key'))
  afterEach(() => { sessionStorage.clear(); vi.unstubAllGlobals() })
  it('sends image content to the free vision router using the visitor key', async () => {
    const fetcher = vi.fn().mockResolvedValue(reply({ choices: [{ message: { content: '  Cell: basic unit of life.  ' } }] }))
    vi.stubGlobal('fetch', fetcher)
    expect(await extractImageText(photo())).toBe('Image source: notes.png\nCell: basic unit of life.')
    const options = fetcher.mock.calls[0][1]
    const request = JSON.parse(options.body)
    expect(options.headers.Authorization).toBe('Bearer test-key')
    expect(request.model).toBe('openrouter/free')
    expect(request.provider.data_collection).toBe('deny')
    expect(request.messages[0].content[1].image_url.url).toMatch(/^data:image\/png;base64,/)
  })
  it('rejects unsupported, empty, oversized and unauthenticated uploads before sending', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    await expect(extractImageText(new File(['x'], 'a.gif', { type: 'image/gif' }))).rejects.toThrow(/PNG/)
    await expect(extractImageText(new File([], 'a.png', { type: 'image/png' }))).rejects.toThrow(/empty/)
    const large = photo(); Object.defineProperty(large, 'size', { value: 8 * 1024 * 1024 + 1 })
    await expect(extractImageText(large)).rejects.toThrow(/8 MB/)
    sessionStorage.clear()
    await expect(extractImageText(photo())).rejects.toThrow(/Connect OpenRouter/)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([401, 402, 429, 503])('handles HTTP %s without a paid fallback', async (status) => {
    const fetcher = vi.fn().mockResolvedValue(reply({}, status)); vi.stubGlobal('fetch', fetcher)
    await expect(extractImageText(photo())).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it.each([{}, { choices: [{ message: { content: ' ' } }] }, { choices: [{ message: { content: [] } }] }])('rejects missing or malformed transcription', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(body)))
    await expect(extractImageText(photo())).rejects.toThrow(/no readable notes/)
  })
})
