
'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useNotifications } from '@/lib/notifications'
import { toast } from 'sonner'

interface NotificationContextType {
  showToast: boolean
  setShowToast: (show: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { notifications, fetchNotifications } = useNotifications()
  const [showToast, setShowToast] = React.useState(true)

  // Fetch notifications when user session is available
  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications(session.user.email)
    }
  }, [session?.user?.email, fetchNotifications])

  // Show toast for new notifications
  useEffect(() => {
    if (showToast && notifications.length > 0) {
      const latestUnread = notifications.filter(n => !n.read)[0]
      if (latestUnread) {
        toast(latestUnread.title, {
          description: latestUnread.message,
          action: latestUnread.actionLabel ? {
            label: latestUnread.actionLabel,
            onClick: () => {
              if (latestUnread.actionUrl) {
                window.location.href = latestUnread.actionUrl
              }
            }
          } : undefined,
        })
      }
    }
  }, [notifications, showToast])

  return (
    <NotificationContext.Provider value={{ showToast, setShowToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}
