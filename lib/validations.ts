import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
})

export const eventSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  description: z.string().optional(),
  type: z.enum(['MAINTENANCE', 'CHANGE', 'MEETING', 'TASK']),
  priority: z.enum(['LOW', 'MED', 'HIGH']).default('MED'),
  impactScope: z.enum(['CUSTOMER', 'SERVICE', 'INTERNAL']).default('INTERNAL'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  ownerUserId: z.string(),
  participantIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
  path: ['endAt'],
})

export const shiftSchema = z.object({
  shiftType: z.enum(['DAY', 'NIGHT', 'WEEKEND']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  assigneeUserId: z.string(),
  backupUserId: z.string().optional(),
  notes: z.string().optional(),
  handoverChecklist: z.record(z.any()).default({}),
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
  path: ['endAt'],
})

export const userSchema = z.object({
  name: z.string().min(1, 'İsim gereklidir'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
})
