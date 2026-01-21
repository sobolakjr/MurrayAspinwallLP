'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Search,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Prospects', href: '/prospects', icon: Search },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Calculator', href: '/calculator', icon: Calculator },
  { name: 'Banking', href: '/banking', icon: CreditCard },
  { name: 'Documents', href: '/documents', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-sm">Murray Aspinwall LP</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <Building2 className="h-6 w-6 text-primary" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn('h-8 w-8', collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t p-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
            pathname === '/settings' && 'bg-primary text-primary-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
