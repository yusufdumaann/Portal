'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail } from 'lucide-react'

export function SettingsContent() {
  const { data: session } = useSession()

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Yönetici'
      case 'MANAGER':
        return 'Müdür'
      case 'MEMBER':
        return 'Üye'
      default:
        return role
    }
  }

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'MANAGER':
        return 'default'
      case 'MEMBER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Profil bilgileriniz ve tercihleriniz
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
          <CardDescription>
            Hesap bilgileriniz (salt okunur)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={session?.user?.name || ''}
                readOnly
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                readOnly
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <div>
              <Badge variant={getRoleVariant(session?.user?.role)}>
                {getRoleLabel(session?.user?.role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
