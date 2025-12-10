import React, { useState, useEffect } from 'react';

interface AlertBannerProps {
  alerts: string[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  const [visibleAlerts, setVisibleAlerts] = useState<Array<{ id: number; message: string }>>([]);

  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1];
      const newAlert = {
        id: Date.now(),
        message: latestAlert
      };

      setVisibleAlerts(prev => [...prev, newAlert]);

      // 5 saniye sonra alerti kaldır
      setTimeout(() => {
        setVisibleAlerts(prev => prev.filter(a => a.id !== newAlert.id));
      }, 5000);
    }
  }, [alerts]);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {visibleAlerts.map((alert) => {
        const isCritical = alert.message.includes('KRİTİK');
        return (
          <div
            key={alert.id}
            className={`${
              isCritical
                ? 'bg-red-600 border-red-500'
                : 'bg-orange-600 border-orange-500'
            } border-2 rounded-lg p-4 shadow-xl animate-slide-in-right`}
          >
            <div className="flex items-start space-x-3">
              {isCritical ? (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{alert.message}</div>
              </div>
              <button
                onClick={() => setVisibleAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
