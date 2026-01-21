'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '@/lib/validations'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
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

async function createEvent(data: any) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create event')
  }
  return res.json()
}

async function updateEvent(id: string, data: any) {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update event')
  }
  return res.json()
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any
  onSuccess: () => void
}) {
  const { data: session } = useSession()
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
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'MEETING',
      priority: 'MED',
      impactScope: 'INTERNAL',
      startAt: '',
      endAt: '',
      ownerUserId: session?.user?.id || '',
      participantIds: [] as string[],
      tags: [] as string[],
    },
  })

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        type: event.type,
        priority: event.priority,
        impactScope: event.impactScope,
        startAt: format(new Date(event.startAt), "yyyy-MM-dd'T'HH:mm"),
        endAt: format(new Date(event.endAt), "yyyy-MM-dd'T'HH:mm"),
        ownerUserId: event.ownerUserId,
        participantIds: event.participants?.map((p: any) => p.userId) || [],
        tags: (event.tags as string[]) || [],
      })
    } else {
      reset({
        title: '',
        description: '',
        type: 'MEETING',
        priority: 'MED',
        impactScope: 'INTERNAL',
        startAt: '',
        endAt: '',
        ownerUserId: session?.user?.id || '',
        participantIds: [],
        tags: [],
      })
    }
  }, [event, session, reset])

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Event oluşturuldu',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Event oluşturulurken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateEvent(event.id, data),
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Event güncellendi',
      })
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Event güncellenirken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      startAt: new Date(data.startAt).toISOString(),
      endAt: new Date(data.endAt).toISOString(),
    }

    if (event) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const participantIds = watch('participantIds') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Event Düzenle' : 'Yeni Event Oluştur'}</DialogTitle>
          <DialogDescription>
            Event bilgilerini doldurun
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input id="title" {...register('title')} disabled={isLoading} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Input id="description" {...register('description')} disabled={isLoading} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tür *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Bakım</SelectItem>
                  <SelectItem value="CHANGE">Değişiklik</SelectItem>
                  <SelectItem value="MEETING">Toplantı</SelectItem>
                  <SelectItem value="TASK">Görev</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik *</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Düşük</SelectItem>
                  <SelectItem value="MED">Orta</SelectItem>
                  <SelectItem value="HIGH">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impactScope">Etki Kapsamı *</Label>
            <Select
              value={watch('impactScope')}
              onValueChange={(value) => setValue('impactScope', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                <SelectItem value="SERVICE">Servis</SelectItem>
                <SelectItem value="INTERNAL">İç</SelectItem>
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
            <Label htmlFor="ownerUserId">Sahip *</Label>
            <Select
              value={watch('ownerUserId')}
              onValueChange={(value) => setValue('ownerUserId', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Katılımcılar</Label>
            <div className="space-y-2">
              {users.map((user: any) => (
                <label key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setValue('participantIds', [...participantIds, user.id])
                      } else {
                        setValue(
                          'participantIds',
                          participantIds.filter((id) => id !== user.id)
                        )
                      }
                    }}
                    disabled={isLoading}
                  />
                  <span className="text-sm">{user.name}</span>
                </label>
              ))}
            </div>
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
              {event ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
