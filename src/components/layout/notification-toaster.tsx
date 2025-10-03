
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { listenToNotifications } from '@/lib/mock-data';
import { markNotificationsAsRead } from '@/lib/server-actions';
import type { Notification } from '@/types';
import { Button } from '../ui/button';
import Link from 'next/link';

// This component listens for notifications and displays them as toasts.
// It does not render any visible UI itself.
export default function NotificationToaster() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) {
      // If user logs out, clear the shown notifications
      setShownNotificationIds(new Set());
      return;
    }

    const unsubscribe = listenToNotifications(user.id, (notifications) => {
      const newUnreadNotifications = notifications.filter(
        (n) => !n.isRead && !shownNotificationIds.has(n.id)
      );

      if (newUnreadNotifications.length > 0) {
        const idsToMarkAsShown = new Set<string>();
        const idsToMarkAsRead: string[] = [];

        newUnreadNotifications.forEach((n) => {
          idsToMarkAsShown.add(n.id);
          idsToMarkAsRead.push(n.id);

          toast({
            title: 'New Notification',
            description: n.message,
            action: n.href ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={n.href}>View</Link>
              </Button>
            ) : undefined,
            duration: 10000, // Keep toast on screen for 10 seconds
          });
        });
        
        // Update the state to prevent showing these notifications again
        setShownNotificationIds((prev) => new Set([...prev, ...idsToMarkAsShown]));

        // Mark them as read in the database
        if (idsToMarkAsRead.length > 0) {
          markNotificationsAsRead(user.id, idsToMarkAsRead);
        }
      }
    });

    return () => unsubscribe();
  }, [user, toast]); // Correctly removed shownNotificationIds from dependencies

  return null; // This component doesn't render anything
}
