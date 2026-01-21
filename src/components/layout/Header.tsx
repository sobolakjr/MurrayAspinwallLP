'use client';

import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        {/* Breadcrumb or page title can go here */}
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/prospects/new">New Prospect</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/properties/new">New Property</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/banking/new">New Transaction</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            2
          </span>
        </Button>
      </div>
    </header>
  );
}
