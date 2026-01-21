'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Filter } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { tr } from 'date-fns/locale'
import { EventDialog } from './event-dialog'
import { EventFilters } from './event-filters'
import { UserRole } from '@prisma/client'
import { useToast } from '@/hooks/use-toast'

async function fetchEvents(filters?: any) {
  const params = new URLSearchParams()
  if (filters?.type) params.append('type', filters.type)
  if (filters?.ownerUserId) params.append('ownerUserId', filters.ownerUserId)
  if (filters?.priority) params.append('priority', filters.priority)
  if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
  if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

  const res = await fetch(`/api/events?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

async function deleteEvent(id: string) {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
  return res.json()
}

export function CalendarContent() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month')
  const [filters, setFilters] = useState<any>({})
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const canManage = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.MANAGER

  // Calculate date range based on view
  const getDateRange = () => {
    if (view === 'month') {
      return {
        startDate: startOfMonth(currentDate),
        endDate: endOfMonth(currentDate),
      }
    } else if (view === 'week') {
      return {
        startDate: startOfWeek(currentDate, { locale: tr }),
        endDate: endOfWeek(currentDate, { locale: tr }),
      }
    }
    return {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  }

  const dateRange = getDateRange()
  const queryFilters = { ...filters, ...dateRange }

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', queryFilters],
    queryFn: () => fetchEvents(queryFilters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast({
        title: 'Başarılı',
        description: 'Event silindi',
      })
    },
    onError: () => {
      toast({
        title: 'Hata',
        description: 'Event silinirken bir hata oluştu',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = (event: any) => {
    if (confirm('Bu eventi silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(event.id)
    }
  }

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { locale: tr }),
    end: endOfWeek(endOfMonth(currentDate), { locale: tr }),
  })

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { locale: tr }),
    end: endOfWeek(currentDate, { locale: tr }),
  })

  const getEventsForDate = (date: Date) => {
    return events.filter((event: any) => {
      const eventStart = new Date(event.startAt)
      const eventEnd = new Date(event.endAt)
      return (
        (eventStart <= date && eventEnd >= date) ||
        format(eventStart, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
    })
  }

  const exportICS = () => {
    window.open('/api/calendar/ics', '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Takvim</h1>
          <p className="text-muted-foreground">
            Operasyon takvimi ve event yönetimi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportICS}>
            <Download className="mr-2 h-4 w-4" />
            ICS Export
          </Button>
          {canManage && (
            <Button onClick={() => {
              setSelectedEvent(null)
              setIsEventDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Event Oluştur
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtreler</CardTitle>
              <CardDescription>Event filtreleme seçenekleri</CardDescription>
            </div>
            <EventFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </CardHeader>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="month">Aylık</TabsTrigger>
          <TabsTrigger value="week">Haftalık</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(currentDate, 'MMMM yyyy', { locale: tr })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
                    }
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Bugün
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
                    }
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                  <div key={day} className="p-2 text-center font-semibold text-sm">
                    {day}
                  </div>
                ))}
                {monthDays.map((day, idx) => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isTodayDate = isToday(day)

                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] p-1 border rounded ${
                        !isCurrentMonth ? 'bg-muted/50' : ''
                      } ${isTodayDate ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isTodayDate ? 'text-primary' : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event: any) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 bg-primary/10 rounded cursor-pointer hover:bg-primary/20"
                            onClick={() => {
                              setSelectedEvent(event)
                              setIsEventDialogOpen(true)
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(event.startAt), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} daha
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(weekDays[0], 'd MMMM', { locale: tr })} -{' '}
                  {format(weekDays[weekDays.length - 1], 'd MMMM yyyy', { locale: tr })}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
                    }
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Bugün
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
                    }
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  const isTodayDate = isToday(day)

                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-4 border rounded-lg ${
                        isTodayDate ? 'bg-primary/5 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <div className="font-semibold">
                            {format(day, 'EEEE', { locale: tr })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(day, 'd MMMM', { locale: tr })}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          {dayEvents.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Event yok</div>
                          ) : (
                            dayEvents.map((event: any) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-2 bg-card border rounded cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  setSelectedEvent(event)
                                  setIsEventDialogOpen(true)
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{event.title}</span>
                                    <Badge variant="outline">{event.type}</Badge>
                                    <Badge
                                      variant={
                                        event.priority === 'HIGH'
                                          ? 'destructive'
                                          : event.priority === 'MED'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                    >
                                      {event.priority}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(event.startAt), 'HH:mm')} -{' '}
                                    {format(new Date(event.endAt), 'HH:mm')}
                                  </div>
                                </div>
                                {canManage && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(event)
                                    }}
                                  >
                                    Sil
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Listesi</CardTitle>
              <CardDescription>Yaklaşan tüm eventler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Event bulunamadı
                  </div>
                ) : (
                  events.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setSelectedEvent(event)
                        setIsEventDialogOpen(true)
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{event.title}</span>
                          <Badge variant="outline">{event.type}</Badge>
                          <Badge
                            variant={
                              event.priority === 'HIGH'
                                ? 'destructive'
                                : event.priority === 'MED'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {event.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(event.startAt), 'd MMMM yyyy HH:mm', { locale: tr })} -{' '}
                          {format(new Date(event.endAt), 'HH:mm', { locale: tr })}
                        </div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </div>
                        )}
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(event)
                          }}
                        >
                          Sil
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        event={selectedEvent}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['events'] })
          setIsEventDialogOpen(false)
          setSelectedEvent(null)
        }}
      />
    </div>
  )
}
