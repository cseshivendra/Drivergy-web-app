
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Circle, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';
import { markNotificationsAsRead } from '@/lib/server-actions';
import { listenToNotifications } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = listenToNotifications(userId, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    await markNotificationsAsRead(userId, unreadIds);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-primary-foreground text-xs items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          <div className="p-2">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <Link key={notif.id} href={notif.href} passHref>
                  <a className={cn(
                    "block p-3 rounded-lg hover:bg-accent transition-colors",
                    !notif.isRead && "bg-primary/10"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Circle className={cn(
                          "h-2 w-2",
                          notif.isRead ? "text-muted-foreground/50" : "text-primary fill-primary"
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </a>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p>No notifications yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
