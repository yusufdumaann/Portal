'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function EventFilters({
  filters,
  onFiltersChange,
}: {
  filters: any
  onFiltersChange: (filters: any) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const cleared = {}
    setLocalFilters(cleared)
    onFiltersChange(cleared)
    setIsOpen(false)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtreler
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(filters).length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Filtreleri</DialogTitle>
          <DialogDescription>
            Eventleri filtrelemek için seçenekleri kullanın
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tür</Label>
            <Select
              value={localFilters.type || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, type: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tümü</SelectItem>
                <SelectItem value="MAINTENANCE">Bakım</SelectItem>
                <SelectItem value="CHANGE">Değişiklik</SelectItem>
                <SelectItem value="MEETING">Toplantı</SelectItem>
                <SelectItem value="TASK">Görev</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Öncelik</Label>
            <Select
              value={localFilters.priority || ''}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, priority: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tümü</SelectItem>
                <SelectItem value="LOW">Düşük</SelectItem>
                <SelectItem value="MED">Orta</SelectItem>
                <SelectItem value="HIGH">Yüksek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters} className="flex-1">
              Uygula
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
