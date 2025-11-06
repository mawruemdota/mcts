
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { Notification } from '@/entities/all';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPanel({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (user) {
      const data = await Notification.filter({ recipient_email: user.email }, '-created_date', 20);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  
  const handleMarkAsRead = async (notificationId) => {
      await Notification.update(notificationId, { is_read: true });
      loadNotifications();
  }

  const handleMarkAllRead = async () => {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      for(const id of unreadIds) {
          await Notification.update(id, { is_read: true });
      }
      loadNotifications();
  }

  return (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{unreadCount}</Badge>
                )}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-card border-border p-0">
             <CardHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base text-foreground">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  {unreadCount > 0 && <Button variant="link" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
                </div>
            </CardHeader>
            <CardContent className="p-2 max-h-96 overflow-y-auto">
                 {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-lg flex items-start gap-3 ${n.is_read ? '' : 'bg-secondary'}`}>
                            <div className="flex-grow">
                                <Link to={n.link_to || '#'}>
                                    <p className="text-sm text-foreground">{n.message}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</p>
                                </Link>
                            </div>
                            {!n.is_read && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleMarkAsRead(n.id)}>
                                    <Check className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </CardContent>
        </PopoverContent>
    </Popover>
  );
}
