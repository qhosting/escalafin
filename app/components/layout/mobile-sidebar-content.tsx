'use client';
import { AppSidebar } from './app-sidebar';
export function MobileSidebarContent({ onClose }: { onClose?: () => void }) {
  return <AppSidebar variant="mobile" onNavigate={onClose} />;
}
