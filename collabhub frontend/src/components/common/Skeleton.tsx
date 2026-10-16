import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  id?: string;
}> = ({ className = 'h-4 w-full', id }) => {
  return (
    <div
      id={id}
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <div
      id={id}
      className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2 flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ columns?: number; id?: string }> = ({
  columns = 5,
  id,
}) => {
  return (
    <tr id={id} className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};
