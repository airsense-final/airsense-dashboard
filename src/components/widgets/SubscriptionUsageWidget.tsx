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
    <div className="bg-gray-800/40 light:bg-white border border-gray-700/50 light:border-gray-200 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold text-gray-400 light:text-gray-500 uppercase tracking-widest">Subscription Usage</h3>
        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${getTierColor()}`}>
          {tier === 'enterprise' ? 'Business' : tier === 'mid' ? 'Pro' : 'Starter'}
        </span>
      </div>

      <div className="space-y-4">
        {/* User Usage */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">Team Members</span>
            <span className="font-mono font-bold text-white light:text-gray-900">{currentUsers} / {maxUsers}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${userPercentage > 90 ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${userPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Device Usage */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">Active ESP Devices</span>
            <span className="font-mono font-bold text-white light:text-gray-900">{currentDevices} / {maxDevices}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-700 light:bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${devicePercentage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${devicePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {tier !== 'enterprise' && (userPercentage >= 90 || devicePercentage >= 90) && (
        <div className="mt-3 text-[9px] text-orange-400 light:text-orange-600 font-medium animate-pulse">
          ⚠️ Approaching limit. Contact admin to upgrade.
        </div>
      )}
    </div>
  );
};
