'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { UserDialog } from './user-dialog'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

async function fetchUsers() {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

async function updateUserRole(userId: string, role: string) {
  const res = await fetch(`/api/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update role')
  }
  return res.json()
}

export function UsersContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Başarılı',
        description: 'Kullanıcı rolü güncellendi',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Rol güncellenirken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const getRoleLabel = (role: string) => {
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

  const getRoleVariant = (role: string) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Kullanıcıları yönetin ve rollerini atayın
          </p>
        </div>
        <Button onClick={() => {
          setSelectedUser(null)
          setIsUserDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
          <CardDescription>
            Sistemdeki tüm kullanıcılar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz kullanıcı yok
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{user.name}</span>
                      <Badge variant={getRoleVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kayıt: {format(new Date(user.createdAt), 'd MMMM yyyy', { locale: tr })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        roleMutation.mutate({
                          userId: user.id,
                          role: e.target.value,
                        })
                      }}
                      className="px-3 py-1 border rounded-md text-sm"
                      disabled={roleMutation.isPending}
                    >
                      <option value="MEMBER">Üye</option>
                      <option value="MANAGER">Müdür</option>
                      <option value="ADMIN">Yönetici</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          setIsUserDialogOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
