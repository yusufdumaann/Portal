'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { shiftSchema } from '@/lib/validations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

async function fetchUsers() {
  const res = await fetch('/api/users')
  if (!res.ok) return []
  return res.json()
}

async function createShift(data: any) {
  const res = await fetch('/api/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create shift')
  }
  return res.json()
}

async function updateShift(id: string, data: any) {
  const res = await fetch(`/api/shifts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update shift')
  }
  return res.json()
}

export function ShiftDialog({
  open,
  onOpenChange,
  shift,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: any
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      shiftType: 'DAY',
      startAt: '',
      endAt: '',
      assigneeUserId: '',
      backupUserId: '',
      notes: '',
      handoverChecklist: {},
    },
  })

  useEffect(() => {
    if (shift) {
      reset({
        shiftType: shift.shiftType,
        startAt: format(new Date(shift.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: format(new Date(shift.endAt), "yyyy-MM-dd'T'HH:mm"),
        assigneeUserId: shift.assigneeUserId,
        backupUserId: shift.backupUserId || '',
        notes: shift.notes || '',
        handoverChecklist: shift.handoverChecklist || {},
      })
    } else {
      reset({
        shiftType: 'DAY',
        startAt: '',
        endAt: '',
        assigneeUserId: '',
        backupUserId: '',
        notes: '',
        handoverChecklist: {},
      })
    }
  }, [shift, reset])

  const createMutation = useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Nöbet oluşturuldu',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Nöbet oluşturulurken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateShift(shift.id, data),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Nöbet güncellendi',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Nöbet güncellenirken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      startAt: new Date(data.startAt).toISOString(),
      endAt: new Date(data.endAt).toISOString(),
      backupUserId: data.backupUserId || undefined,
    }

    if (shift) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{shift ? 'Nöbet Düzenle' : 'Yeni Nöbet Oluştur'}</DialogTitle>
          <DialogDescription>
            Nöbet bilgilerini doldurun
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shiftType">Nöbet Türü *</Label>
            <Select
              value={watch('shiftType')}
              onValueChange={(value) => setValue('shiftType', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">Gündüz</SelectItem>
                <SelectItem value="NIGHT">Gece</SelectItem>
                <SelectItem value="WEEKEND">Hafta Sonu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAt">Başlangıç *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                {...register('startAt')}
                disabled={isLoading}
              />
              {errors.startAt && (
                <p className="text-sm text-destructive">{errors.startAt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endAt">Bitiş *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...register('endAt')}
                disabled={isLoading}
              />
              {errors.endAt && (
                <p className="text-sm text-destructive">{errors.endAt.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigneeUserId">Nöbetçi *</Label>
            <Select
              value={watch('assigneeUserId')}
              onValueChange={(value) => setValue('assigneeUserId', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nöbetçi seçin" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigneeUserId && (
              <p className="text-sm text-destructive">{errors.assigneeUserId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupUserId">Yedek Nöbetçi (Opsiyonel)</Label>
            <Select
              value={watch('backupUserId') || ''}
              onValueChange={(value) => setValue('backupUserId', value || undefined)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Yedek nöbetçi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Yok</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              {...register('notes')}
              disabled={isLoading}
              placeholder="Nöbet ile ilgili notlar"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {shift ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
