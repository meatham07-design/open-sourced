import { z } from 'zod'

const generatedSetSchema = z.object({
  title: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  description: z.string(),
  cards: z.array(z.object({
    term: z.string().trim().min(1),
    definition: z.string().trim().min(1),
    note: z.string().optional().default(''),
  })).min(2).max(100),
})

export function validateGeneratedSet(value: unknown, count?: number) {
  const result = generatedSetSchema.safeParse(value)
  if (!result.success) throw new Error('The AI returned incomplete study cards. Try again; your source material is still here.')
  if (count !== undefined && result.data.cards.length !== count) throw new Error(`The AI did not return the requested ${count} cards. Try again or use automatic card count.`)
  return result.data
}
