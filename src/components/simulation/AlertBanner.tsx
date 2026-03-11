import React, { useState, useEffect } from 'react';

interface AlertBannerProps {
  alerts: string[];
}

interface AlertItem {
  id: number;
  message: string;
  timestamp: Date;
  isExiting: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  const [visibleAlerts, setVisibleAlerts] = useState<AlertItem[]>([]);
  const MAX_VISIBLE_ALERTS = 3; // Maximum 3 alerts at once

  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[alerts.length - 1];
      const newAlert: AlertItem = {
        id: Date.now(),
        message: latestAlert,
        timestamp: new Date(),
        isExiting: false
      };

      setVisibleAlerts(prev => {
        // Remove oldest alert if we're at max capacity
        const updatedAlerts = prev.length >= MAX_VISIBLE_ALERTS 
          ? prev.slice(1) // Remove first (oldest) alert
          : prev;
        return [...updatedAlerts, newAlert];
      });

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        handleDismiss(newAlert.id);
      }, 5000);
    }
  }, [alerts]);

  const handleDismiss = (id: number) => {
    // Trigger exit animation
    setVisibleAlerts(prev => prev.map(a => a.id === id ? { ...a, isExiting: true } : a));
    
    // Remove after animation completes
    setTimeout(() => {
      setVisibleAlerts(prev => prev.filter(a => a.id !== id));
    }, 300);
  };

  const getSeverityStyles = (message: string) => {
    if (message.includes('CRITICAL')) {
      return {
        bg: 'bg-gradient-to-r from-red-600 to-red-700',
        border: 'border-red-500',
        icon: 'text-red-200',
        glow: 'shadow-red-500/50'
      };
    } else if (message.includes('WARNING')) {
      return {
        bg: 'bg-gradient-to-r from-yellow-600 to-orange-600',
        border: 'border-yellow-500',
        icon: 'text-yellow-200',
        glow: 'shadow-yellow-500/50'
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
        border: 'border-blue-500',
        icon: 'text-blue-200',
        glow: 'shadow-blue-500/50'
      };
    }
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 space-y-2 pointer-events-none" style={{ maxWidth: '400px', width: '90vw' }}>
      {visibleAlerts.map((alert) => {
        const styles = getSeverityStyles(alert.message);
        const isCritical = alert.message.includes('CRITICAL');
        
        return (
          <div
            key={alert.id}
            className={`pointer-events-auto transform transition-all duration-300 ${
              alert.isExiting 
                ? 'scale-95 opacity-0' 
                : 'scale-100 opacity-100'
            }`}
            style={{
              animation: alert.isExiting ? 'none' : 'slideInTop 0.3s ease-out'
            }}
          >
            <div
              className={`${styles.bg} ${styles.border} border-2 rounded-lg shadow-2xl ${styles.glow} backdrop-blur-sm`}
            >
              <div className="flex items-start gap-3 p-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  {isCritical ? (
                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-xs leading-relaxed break-words">
                    {alert.message}
                  </p>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-0.5 hover:bg-white/10 rounded"
                  aria-label="Dismiss alert"
                >
                  <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 bg-white/20 overflow-hidden rounded-b-lg">
                <div 
                  className="h-full bg-white/60"
                  style={{
                    animation: 'shrink 5s linear forwards'
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideInTop {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
