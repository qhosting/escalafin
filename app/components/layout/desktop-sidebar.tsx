'use client';
import { AppSidebar } from './app-sidebar';
export function DesktopSidebar({ collapsed, onToggle, className }: { collapsed: boolean; onToggle: () => void; className?: string }) {
  return <div className={`fixed inset-y-0 left-0 z-40 ${className || ''}`}><AppSidebar collapsed={collapsed} onToggle={onToggle} /></div>;
}
