import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { userSchema, updateUserRoleSchema } from '@/lib/validations'

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: UserRole
}

export class UserService {
  async create(data: CreateUserInput) {
    const validated = userSchema.parse(data)

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existing) {
      throw new Error('Bu email adresi zaten kullanılıyor')
    }

    const passwordHash = await bcrypt.hash(validated.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: validated.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return user
  }

  async updateRole(userId: string, role: UserRole) {
    const validated = updateUserRoleSchema.parse({ role })

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: validated.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return user
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
  }
}

export const userService = new UserService()
