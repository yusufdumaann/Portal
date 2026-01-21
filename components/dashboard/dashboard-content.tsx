'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Phone, AlertCircle, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Link from 'next/link'
import { UserRole } from '@prisma/client'

async function fetchDashboardData() {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

export function DashboardContent() {
  const { data: session } = useSession()
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Veri yüklenirken bir hata oluştu</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const canManage = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.MANAGER

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Hoş geldiniz, {session?.user?.name}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Link href="/calendar?action=create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Event Oluştur
              </Button>
            </Link>
            <Link href="/oncall?action=create">
              <Button variant="outline">
                <Phone className="mr-2 h-4 w-4" />
                Nöbet Ata
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current On-Call */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugün Nöbetçi</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data?.currentShift ? (
              <div>
                <div className="text-2xl font-bold">{data.currentShift.assignee.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.currentShift.backup && `Yedek: ${data.currentShift.backup.name}`}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">Yok</div>
            )}
          </CardContent>
        </Card>

        {/* Today's Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Eventler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.todayEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.todayEvents?.length === 0 && 'Bugün event yok'}
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yaklaşan Eventler</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.upcomingEvents?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sonraki 7 gün içinde
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Events List */}
      {data?.todayEvents && data.todayEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bugünkü Eventler</CardTitle>
            <CardDescription>
              {format(new Date(), 'd MMMM yyyy', { locale: tr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.todayEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.startAt), 'HH:mm')} -{' '}
                      {format(new Date(event.endAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events List */}
      {data?.upcomingEvents && data.upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Eventler (7 Gün)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.upcomingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{event.title}</h3>
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.startAt), 'd MMMM yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!data?.todayEvents || data.todayEvents.length === 0) &&
        (!data?.upcomingEvents || data.upcomingEvents.length === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz event yok</h3>
                <p className="text-muted-foreground mb-4">
                  Bugün ve yaklaşan 7 gün içinde event bulunmuyor.
                </p>
                {canManage && (
                  <Link href="/calendar?action=create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      İlk Event'i Oluştur
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
