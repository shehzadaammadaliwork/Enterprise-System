import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useNotifications,
} from '../api/hooks';
import { PreferencesTab } from '../components/PreferencesTab';
import { BroadcastModal } from '../components/BroadcastModal';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { cn } from '../../../lib/utils';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function InboxTab() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading } = useNotifications(unreadOnly);
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={unreadOnly ? 'outline' : 'default'} onClick={() => setUnreadOnly(false)}>
            All
          </Button>
          <Button type="button" size="sm" variant={unreadOnly ? 'default' : 'outline'} onClick={() => setUnreadOnly(true)}>
            Unread
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Mark all as read
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start justify-between gap-4 rounded-lg border p-4',
                !notification.readAt && 'bg-primary/5',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', !notification.readAt && 'font-semibold')}>{notification.title}</span>
                  {!notification.readAt && <Badge variant="secondary">Unread</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
              </div>
              <Button
                type="button"
                variant="link"
                className="h-auto shrink-0 p-0"
                onClick={() =>
                  notification.readAt
                    ? markUnread.mutate(notification.id)
                    : markRead.mutate(notification.id)
                }
              >
                {notification.readAt ? 'Mark unread' : 'Mark read'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationsPage() {
  const hasEmployeeProfile = useAuthStore((state) => state.hasEmployeeProfile);
  const hasAnyPermission = useAuthStore((state) => state.permissions.length > 0);
  const canBroadcast = useAuthStore((state) => state.hasPermission('notifications', 'CREATE'));
  const [showBroadcast, setShowBroadcast] = useState(false);

  // State C (no Employee profile AND no effective permissions) — the nav
  // item is hidden, so this page shouldn't normally be reached; if hit
  // directly by URL, bounce to the Dashboard the same way MyWorkPage does
  // for its own out-of-state direct-navigation case.
  if (!hasEmployeeProfile && !hasAnyPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your notifications and delivery preferences.</p>
        </div>
        {canBroadcast && (
          <Button type="button" size="sm" onClick={() => setShowBroadcast(true)}>
            Send announcement
          </Button>
        )}
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <InboxTab />
        </TabsContent>
        <TabsContent value="preferences" className="mt-4">
          <PreferencesTab />
        </TabsContent>
      </Tabs>

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
    </div>
  );
}
