import { z } from 'zod'

export const AuditRequestSchema = z.object({
  selectedTools: z.array(z.string()).min(1, 'Select at least one tool'),
  email: z.string().email().optional(),
  companyName: z.string().optional(),
})

export type AuditRequest = z.infer<typeof AuditRequestSchema>
