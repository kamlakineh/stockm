import React from 'react';
import { useStore } from '@/context/StoreContext';
import { X, Bell, AlertTriangle, AlertOctagon, TrendingUp, UserCheck, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setOwnerTab, role } = useStore();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'OUT_OF_STOCK':
        return <AlertOctagon className="w-5 h-5 text-rose-500" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'LARGE_SALE':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'CASHIER_ACTIVITY':
        return <UserCheck className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-100">Notifications Center</h2>
                <p className="text-xs text-slate-400">
                  {notifications.filter(n => !n.isRead).length} unread updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Read All
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotificationAsRead(n.id);
                    if (role === 'OWNER' && n.linkTab) {
                      if (n.linkTab === 'inventory') setOwnerTab(1);
                      if (n.linkTab === 'sales') setOwnerTab(2);
                      if (n.linkTab === 'more') setOwnerTab(4);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    n.isRead
                      ? 'bg-slate-900/40 border-slate-800 opacity-75'
                      : 'bg-slate-800/80 border-indigo-500/30 shadow-md hover:border-indigo-500/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 bg-slate-800 rounded-lg">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-slate-200">{n.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
