
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { listenToNotifications } from '@/lib/mock-data';
import { markNotificationsAsRead } from '@/lib/server-actions';
import type { Notification } from '@/types';
import { Button } from '../ui/button';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { parseISO } from 'date-fns';

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const unsubscribe = listenToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0 && user?.id) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      markNotificationsAsRead(user.id, unreadIds);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={() => user?.id && markNotificationsAsRead(user.id, notifications.map(n => n.id))}>
              <CheckCheck className="mr-1 h-3 w-3" /> Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map(notification => (
            <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
              <Link href={notification.href || '#'}>
                <div className="flex flex-col">
                  <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <p className="text-sm text-muted-foreground text-center w-full py-4">No notifications yet.</p>
          </DropdownMenuItem>
        )}
         <DropdownMenuSeparator />
         <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications" className="justify-center text-sm text-primary">
                View All Notifications
            </Link>
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
