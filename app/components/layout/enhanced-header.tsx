
'use client'

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Bell, LogOut, Settings, User, Menu, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { cn } from '@/lib/utils'

interface EnhancedHeaderProps {
  title: string
  subtitle?: string
  showMobileMenu?: boolean
  onMobileMenuToggle?: () => void
  className?: string
}

export function EnhancedHeader({ 
  title, 
  subtitle, 
  showMobileMenu = false,
  onMobileMenuToggle,
  className 
}: EnhancedHeaderProps) {
  const { data: session } = useSession()

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador'
      case 'ASESOR':
        return 'Asesor'
      case 'CLIENTE':
        return 'Cliente'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'ASESOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'CLIENTE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name && name.length > 0) {
      const names = name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Left side - Title and mobile menu */}
        <div className="flex items-center gap-4">
          {showMobileMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Collection Module - Only for ADMIN and ADVISOR */}
          {session?.user && ['ADMIN', 'ADVISOR'].includes((session as any).user?.role) && (
            <Link href="/mobile/cobranza">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Cobranza Móvil
              </Button>
            </Link>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(session.user.name || '', session.user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name || 'Usuario'}
                      </p>
                      <Badge className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        getRoleBadgeColor((session as any).user?.role || 'USER')
                      )}>
                        {getRoleLabel((session as any).user?.role || 'USER')}
                      </Badge>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                
                {['ADMIN', 'ADVISOR'].includes((session as any).user?.role) && (
                  <Link href="/mobile/cobranza">
                    <DropdownMenuItem className="cursor-pointer">
                      <Smartphone className="mr-2 h-4 w-4" />
                      <span>Cobranza Móvil</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 dark:text-red-400"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
