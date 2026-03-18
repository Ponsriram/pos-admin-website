'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { Notification } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  BellOff,
  CheckCheck,
  Circle,
  Inbox,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRead, setFilterRead] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    loadNotifications()
  }, [storeId, filterRead])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const data = await api.getNotifications(storeId || undefined, filterRead)
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await api.markNotificationRead(id, true)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Failed to mark notification read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(storeId || undefined)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Failed to mark all notifications read:', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'order': return 'bg-blue-500/10 text-blue-600'
      case 'payment': return 'bg-green-500/10 text-green-600'
      case 'inventory': return 'bg-orange-500/10 text-orange-600'
      case 'shift': return 'bg-purple-500/10 text-purple-600'
      case 'alert': return 'bg-red-500/10 text-red-600'
      default: return 'bg-gray-500/10 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filterRead === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRead(undefined)}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filterRead === false ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRead(filterRead === false ? undefined : false)}
        >
          <Circle className="h-3 w-3 mr-1.5 fill-current" />
          Unread
        </Button>
        <Button
          variant={filterRead === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRead(filterRead === true ? undefined : true)}
        >
          <CheckCheck className="h-3 w-3 mr-1.5" />
          Read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[calc(100vh-18rem)]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}><CardContent className="h-20" /></Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Inbox className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">
              {filterRead === false ? 'No unread notifications' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer hover:shadow-sm transition-all',
                  !notification.is_read && 'border-l-4 border-l-primary bg-primary/[0.02]'
                )}
                onClick={() => !notification.is_read && handleMarkRead(notification.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5 p-1.5 rounded-full', notification.is_read ? 'bg-muted' : 'bg-primary/10')}>
                      {notification.is_read ? (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Bell className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn('font-medium text-sm', !notification.is_read && 'text-foreground')}>
                          {notification.title}
                        </p>
                        {notification.category && (
                          <Badge variant="outline" className={cn('text-[10px] px-1.5', getCategoryColor(notification.category))}>
                            {notification.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
