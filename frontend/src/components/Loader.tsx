import React from 'react';
import { Loader2, FolderOpen } from 'lucide-react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col shadow-sm animate-pulse"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-16 h-5 bg-stone-200 rounded-md"></div>
            <div className="w-16 h-4 bg-stone-100 rounded"></div>
          </div>
          <div className="w-3/4 h-5 bg-stone-200 rounded mb-2"></div>
          <div className="w-1/2 h-4 bg-stone-100 rounded mb-4"></div>
          <div className="w-full h-3 bg-stone-100 rounded mb-2"></div>
          <div className="w-full h-3 bg-stone-100 rounded mb-2"></div>
          <div className="w-2/3 h-3 bg-stone-100 rounded mb-6"></div>
          <div className="mt-auto border-t border-stone-100 pt-4 flex justify-between items-end">
            <div className="flex flex-col gap-1.5">
              <div className="w-20 h-3 bg-stone-100 rounded"></div>
              <div className="w-28 h-3 bg-stone-200 rounded"></div>
            </div>
            <div className="w-8 h-8 bg-stone-100 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-stone-200 rounded-xl p-4 flex gap-4 items-center shadow-sm animate-pulse"
        >
          <div className="w-16 h-12 bg-stone-100 rounded-lg shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 bg-stone-200 rounded"></div>
            <div className="w-2/3 h-3 bg-stone-100 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-stone-100 rounded-lg shrink-0"></div>
        </div>
      ))}
    </div>
  );
};

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading academic records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3 text-stone-600">
      <Loader2 className="w-7 h-7 text-stone-700 animate-spin" />
      <span className="font-serif italic text-xs text-stone-500">{label}</span>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, icon }) => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-sm my-6 max-w-md mx-auto">
      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 text-stone-500">
        {icon || <FolderOpen className="w-6 h-6 text-stone-400" />}
      </div>
      <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 max-w-xs mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

