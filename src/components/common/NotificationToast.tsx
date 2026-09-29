// EstateFlow Control - NotificationToast Stack
import React from 'react';
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiAlertCircle, FiX } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';

export const NotificationToastStack: React.FC = () => {
  const { notifications, dismissNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {notifications.map((notif) => {
        let icon = <FiInfo className="w-5 h-5 text-blue-400 shrink-0" />;
        let borderClass = 'border-blue-500/30';
        let bgClass = 'bg-[#141923]/95';

        if (notif.type === 'success') {
          icon = <FiCheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderClass = 'border-emerald-500/30';
        } else if (notif.type === 'warning') {
          icon = <FiAlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderClass = 'border-amber-500/30';
        } else if (notif.type === 'error') {
          icon = <FiAlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-rose-500/30';
        }

        return (
          <div
            key={notif.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${borderClass} ${bgClass} backdrop-blur-xl shadow-2xl text-white transition-all animate-in slide-in-from-bottom-5 duration-200`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-tight text-neutral-100">
                {notif.title}
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                {notif.message}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              aria-label="Dismiss notification"
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
