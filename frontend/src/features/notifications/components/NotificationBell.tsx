import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useMarkNotificationRead, useNotifications, useUnreadCount } from '../api/hooks';
import { useLiveNotifications } from '../hooks/useLiveNotifications';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { cn } from '../../../lib/utils';
import type { AppNotification } from '../api/types';

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  useLiveNotifications();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();

  const recent = data?.data.slice(0, 5) ?? [];

  function handleSelect(notification: AppNotification) {
    if (!notification.readAt) markRead.mutate(notification.id);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {!!unreadCount && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          recent.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-0.5 whitespace-normal"
              onSelect={() => handleSelect(notification)}
            >
              <div className="flex w-full items-center gap-2">
                <span className={cn('flex-1 text-sm', !notification.readAt && 'font-semibold')}>
                  {notification.title}
                </span>
                {!notification.readAt && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
              </div>
              <span className="text-xs text-muted-foreground">{notification.message}</span>
              <span className="text-[11px] text-muted-foreground">{timeAgo(notification.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/notifications')}>View all notifications</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
