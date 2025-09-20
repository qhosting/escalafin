
// Sistema de notificaciones in-app para EscalaFin
import { create } from 'zustand'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
  userId: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  fetchNotifications: (userId: string) => Promise<void>
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      read: false,
    }
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }))
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id)
      const wasUnread = notification && !notification.read
      
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }
    })
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  },

  fetchNotifications: async (userId) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.filter((n: Notification) => !n.read).length
        set({ 
          notifications: data, 
          unreadCount,
          isLoading: false 
        })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      set({ isLoading: false })
    }
  },
}))

// Funciones utilitarias para crear notificaciones comunes
export const createNotification = {
  loanApproved: (clientName: string, amount: number): Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'> => ({
    type: 'success',
    title: 'Préstamo Aprobado',
    message: `El préstamo de ${clientName} por $${amount.toLocaleString()} ha sido aprobado`,
    actionUrl: '/admin/dashboard',
    actionLabel: 'Ver Detalles'
  }),

  loanRejected: (clientName: string): Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'> => ({
    type: 'error',
    title: 'Préstamo Rechazado',
    message: `La solicitud de préstamo de ${clientName} ha sido rechazada`,
    actionUrl: '/admin/dashboard',
    actionLabel: 'Ver Solicitudes'
  }),

  paymentReceived: (clientName: string, amount: number): Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'> => ({
    type: 'info',
    title: 'Pago Recibido',
    message: `Pago de $${amount.toLocaleString()} recibido de ${clientName}`,
    actionUrl: '/asesor/dashboard',
    actionLabel: 'Ver Pagos'
  }),

  paymentOverdue: (clientName: string, daysOverdue: number): Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'> => ({
    type: 'warning',
    title: 'Pago Vencido',
    message: `${clientName} tiene un pago vencido hace ${daysOverdue} días`,
    actionUrl: '/asesor/dashboard',
    actionLabel: 'Gestionar'
  }),

  newApplication: (clientName: string, advisorName: string): Omit<Notification, 'id' | 'createdAt' | 'read' | 'userId'> => ({
    type: 'info',
    title: 'Nueva Solicitud',
    message: `${advisorName} ha enviado una nueva solicitud para ${clientName}`,
    actionUrl: '/admin/dashboard',
    actionLabel: 'Revisar'
  })
}
