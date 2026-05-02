import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-700/50 light:bg-gray-200 rounded-md ${className}`} />
  );
};

export const SensorCardSkeleton = () => (
  <div className="bg-gray-800/40 light:bg-white border border-gray-700/30 light:border-gray-200 rounded-xl p-4 h-40 flex flex-col space-y-3">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-2.5 w-2.5 rounded-full" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      <Skeleton className="h-12 w-full" />
    </div>
    <div className="flex justify-center">
      <Skeleton className="h-6 w-1/3" />
    </div>
  </div>
);

export const WidgetSkeleton = () => (
  <div className="bg-gray-800/40 light:bg-white border border-gray-700/30 light:border-gray-200 rounded-xl p-4 h-48 space-y-4">
    <div className="flex items-center gap-2">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center space-x-4 px-6 py-4 border-b border-gray-700/30 light:border-gray-200">
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-3 w-1/6" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
    <Skeleton className="h-8 w-16 rounded-lg" />
  </div>
);
