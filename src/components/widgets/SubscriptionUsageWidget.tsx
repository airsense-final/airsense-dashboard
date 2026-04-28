import React from 'react';

interface SubscriptionUsageWidgetProps {
  currentUsers: number;
  maxUsers: number;
  currentDevices: number;
  maxDevices: number;
  tier: string;
}

export const SubscriptionUsageWidget: React.FC<SubscriptionUsageWidgetProps> = ({
  currentUsers,
  maxUsers,
  currentDevices,
  maxDevices,
  tier
}) => {
  const userPercentage = Math.min((currentUsers / maxUsers) * 100, 100);
  const devicePercentage = Math.min((currentDevices / maxDevices) * 100, 100);

  const getTierColor = () => {
    if (tier === 'enterprise') return 'text-emerald-400 border-emerald-500/20';
    if (tier === 'mid') return 'text-cyan-400 border-cyan-500/20';
    return 'text-gray-400 border-gray-500/20';
  };

  return (
    <div className="bg-gray-800/40 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-xl p-1.5 sm:p-3 shadow-xl backdrop-blur-md transition-all duration-300">
      {/* Mobile: Mini Layout | Desktop: Regular Layout */}
      <div className="flex lg:flex-col lg:space-y-3 items-center lg:items-stretch gap-2 lg:gap-0">
        
        {/* Tier Indicator - Extremely Small on Mobile */}
        <div className="flex justify-between items-center mb-0 lg:mb-1">
          <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border leading-none ${getTierColor()}`}>
            {tier === 'enterprise' ? 'Business' : tier === 'mid' ? 'Pro' : 'Starter'}
          </span>
          <h3 className="hidden lg:block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Usage</h3>
        </div>

        {/* Progress Bars Container */}
        <div className="flex flex-1 gap-2 lg:flex-col lg:gap-3 lg:space-y-3">
          {/* User Usage */}
          <div className="flex-1 lg:flex-none">
            <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5 lg:mb-1">
              <span className="text-gray-500 hidden sm:inline">Users</span>
              <span className="font-mono font-bold text-white light:text-gray-900">{currentUsers}/{maxUsers}</span>
            </div>
            <div className="h-0.5 sm:h-1 w-full bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${userPercentage > 90 ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${userPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Device Usage */}
          <div className="flex-1 lg:flex-none">
            <div className="flex justify-between text-[6px] sm:text-[8px] mb-0.5 lg:mb-1">
              <span className="text-gray-500 hidden sm:inline">Devices</span>
              <span className="font-mono font-bold text-white light:text-gray-900">{currentDevices}/{maxDevices}</span>
            </div>
            <div className="h-0.5 sm:h-1 w-full bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${devicePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${devicePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
