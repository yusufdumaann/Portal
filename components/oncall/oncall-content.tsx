'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Phone, User } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ShiftDialog } from './shift-dialog'
import { UserRole } from '@prisma/client'
import { useToast } from '@/hooks/use-toast'

async function fetchShifts() {
  const res = await fetch('/api/shifts')
  if (!res.ok) throw new Error('Failed to fetch shifts')
  return res.json()
}

async function fetchCurrentShift() {
  const res = await fetch('/api/shifts')
  if (!res.ok) throw new Error('Failed to fetch shifts')
  const shifts = await res.json()
  const now = new Date()
  return shifts.find((shift: any) => {
    const start = new Date(shift.startAt)
    const end = new Date(shift.endAt)
    return start <= now && end >= now
  })
}

async function fetchStats() {
  const res = await fetch('/api/shifts/stats?days=30')
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

async function deleteShift(id: string) {
  const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete shift')
  return res.json()
}

export function OnCallContent() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<any>(null)

  const canManage = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.MANAGER

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: fetchShifts,
  })

  const { data: currentShift } = useQuery({
    queryKey: ['currentShift'],
    queryFn: fetchCurrentShift,
  })

  const { data: stats = [] } = useQuery({
    queryKey: ['shiftStats'],
    queryFn: fetchStats,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['currentShift'] })
      queryClient.invalidateQueries({ queryKey: ['shiftStats'] })
      toast({
        title: 'Başarılı',
        description: 'Nöbet silindi',
      })
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Nöbet silinirken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = (shift: any) => {
    if (confirm('Bu nöbeti silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(shift.id)
    }
  }

  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'DAY':
        return 'Gündüz'
      case 'NIGHT':
        return 'Gece'
      case 'WEEKEND':
        return 'Hafta Sonu'
      default:
        return type
    }
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'DAY':
        return 'default'
      case 'NIGHT':
        return 'secondary'
      case 'WEEKEND':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nöbet Planlama</h1>
          <p className="text-muted-foreground">
            Nöbet ve shift yönetimi
          </p>
        </div>
        {canManage && (
          <Button onClick={() => {
            setSelectedShift(null)
            setIsShiftDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nöbet Ata
          </Button>
        )}
      </div>

      {/* Current Shift Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Bugün Nöbetçi
          </CardTitle>
          <CardDescription>
            Şu anda aktif nöbet bilgisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentShift ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5" />
                    <span className="font-semibold text-lg">
                      {currentShift.assignee?.name}
                    </span>
                    <Badge variant={getShiftTypeColor(currentShift.shiftType)}>
                      {getShiftTypeLabel(currentShift.shiftType)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentShift.startAt), 'd MMMM yyyy HH:mm', { locale: tr })} -{' '}
                    {format(new Date(currentShift.endAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                  </p>
                  {currentShift.backup && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Yedek: {currentShift.backup.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Şu anda aktif nöbet yok
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nöbet İstatistikleri (Son 30 Gün)</CardTitle>
            <CardDescription>
              Kişi başına nöbet sayıları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.map((stat: any) => (
                <div
                  key={stat.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span className="font-medium">{stat.userName}</span>
                  <Badge variant="outline">{stat.shiftCount} nöbet</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>Nöbet Listesi</CardTitle>
          <CardDescription>
            Tüm planlanmış nöbetler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz nöbet planlanmamış
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift: any) => {
                const isCurrent = currentShift?.id === shift.id
                return (
                  <div
                    key={shift.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isCurrent ? 'bg-primary/5 border-primary' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{shift.assignee?.name}</span>
                        <Badge variant={getShiftTypeColor(shift.shiftType)}>
                          {getShiftTypeLabel(shift.shiftType)}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="default">Aktif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(shift.startAt), 'd MMMM yyyy HH:mm', { locale: tr })} -{' '}
                        {format(new Date(shift.endAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                      </p>
                      {shift.backup && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Yedek: {shift.backup.name}
                        </p>
                      )}
                      {shift.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Not: {shift.notes}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedShift(shift)
                            setIsShiftDialogOpen(true)
                          }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(shift)}
                        >
                          Sil
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ShiftDialog
        open={isShiftDialogOpen}
        onOpenChange={setIsShiftDialogOpen}
        shift={selectedShift}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['shifts'] })
          queryClient.invalidateQueries({ queryKey: ['currentShift'] })
          queryClient.invalidateQueries({ queryKey: ['shiftStats'] })
          setIsShiftDialogOpen(false)
          setSelectedShift(null)
        }}
      />
    </div>
  )
}
