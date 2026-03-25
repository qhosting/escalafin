
'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Bell, CheckCheck, X, Clock, ArrowRight, BellOff,
  CreditCard, DollarSign, AlertTriangle, Info, CheckCircle,
  Smartphone, ChevronDown, Trash2, BellRing
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, type Notification } from '@/lib/notifications'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

// ── Icono según tipo de notificación ──────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const base = 'h-5 w-5'
  switch (type) {
    case 'success': return <CheckCircle className={`${base} text-green-500`} />
    case 'error':   return <AlertTriangle className={`${base} text-red-500`} />
    case 'warning': return <AlertTriangle className={`${base} text-amber-500`} />
    case 'payment': return <DollarSign className={`${base} text-emerald-500`} />
    case 'loan':    return <CreditCard className={`${base} text-blue-500`} />
    default:        return <Info className={`${base} text-indigo-500`} />
  }
}

function NotifBg(type: string) {
  switch (type) {
    case 'success': return 'bg-green-50 dark:bg-green-900/20'
    case 'error':   return 'bg-red-50 dark:bg-red-900/20'
    case 'warning': return 'bg-amber-50 dark:bg-amber-900/20'
    case 'payment': return 'bg-emerald-50 dark:bg-emerald-900/20'
    case 'loan':    return 'bg-blue-50 dark:bg-blue-900/20'
    default:        return 'bg-indigo-50 dark:bg-indigo-900/20'
  }
}

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `Hace ${d}d`
  if (h > 0) return `Hace ${h}h`
  if (m > 0) return `Hace ${m}m`
  return 'Ahora mismo'
}

// ── Componente principal ──────────────────────────────────────────────────────
export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
  const { isSubscribed, permission, subscribe } = usePushNotifications()

  const [open, setOpen]         = useState(false)
  const [filter, setFilter]     = useState<'all' | 'unread'>('all')
  const [subscribing, setSubscribing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      const ok = await subscribe()
      if (ok) {
        toast.success('¡Notificaciones push activadas!')
      } else {
        toast.error('No se pudo activar — verifica los permisos del navegador')
      }
    } finally {
      setSubscribing(false)
    }
  }

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id)
    if (n.actionUrl) window.location.href = n.actionUrl
  }

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Trigger Button ── */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 rounded-full"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* ── Panel Dropdown ── */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-12 z-50 w-[360px] max-w-[95vw]',
            'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800',
            'overflow-hidden flex flex-col',
            'transition-all duration-200 origin-top-right',
            // En modo PWA/móvil — panel más grande y pega a la pantalla
            'sm:w-[380px]'
          )}
          style={{ maxHeight: 'calc(100dvh - 80px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm text-gray-900 dark:text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-xs text-gray-500 hover:text-primary"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Leer todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-7 w-7 p-0 text-gray-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Push Notification Banner (si no está suscrito) */}
          {permission !== 'granted' && !isSubscribed && (
            <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg shrink-0">
                <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">Activa notificaciones push</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5">Recibe alertas en tu teléfono aunque no tengas la app abierta</p>
              </div>
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="h-7 text-[11px] shrink-0 bg-indigo-600 hover:bg-indigo-700"
              >
                {subscribing ? 'Activando...' : 'Activar'}
              </Button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1 px-3 pt-3 pb-1">
            {(['all', 'unread'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  filter === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {tab === 'all' ? `Todas (${notifications.length})` : `Sin leer (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Lista */}
          <ScrollArea className="flex-1 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <BellOff className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {filter === 'unread' ? 'Todo al día 🎉' : 'Sin notificaciones'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {filter === 'unread' ? 'No tienes mensajes pendientes' : 'Las alertas aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800 pb-2">
                {displayed.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all',
                      'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99]',
                      !notif.read && 'bg-indigo-50/40 dark:bg-indigo-900/10 border-l-2 border-l-primary'
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Icono */}
                    <div className={cn('mt-0.5 p-2 rounded-xl shrink-0', NotifBg(notif.type))}>
                      <NotifIcon type={notif.type} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          'text-sm leading-tight',
                          !notif.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'
                        )}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.actionLabel && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-primary font-semibold">
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}

                      {!notif.read && (
                        <span className="absolute top-4 right-10 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notif.id)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button
                onClick={() => { markAllAsRead(); setOpen(false) }}
                className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar
              </button>
              <Link
                href="/notificaciones"
                className="text-[11px] text-primary font-semibold flex items-center gap-1"
                onClick={() => setOpen(false)}
              >
                Ver historial
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Push subscribed indicator */}
          {isSubscribed && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-gray-400">Push activo en este dispositivo</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
