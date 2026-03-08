import { Skeleton } from "@/components/ui/skeleton";

export const NavCardSkeleton = () => (
  <div className="rounded-xl md:rounded-2xl p-4 md:p-6 border border-border bg-card">
    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl mb-3 md:mb-4" />
    <Skeleton className="h-5 md:h-6 w-3/4 mb-2 md:mb-3" />
    <Skeleton className="h-3 md:h-4 w-full" />
    <Skeleton className="h-3 md:h-4 w-2/3 mt-1" />
  </div>
);

export const PropertyCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <Skeleton className="h-36 md:h-48 w-full" />
    <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 md:h-5 flex-1" />
        <Skeleton className="h-5 md:h-7 w-20 md:w-24 rounded" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 md:h-4 w-32" />
      </div>
      <div className="flex gap-1.5 md:gap-3 pt-2 md:pt-3 border-t border-border">
        <Skeleton className="h-6 md:h-7 w-12 md:w-14 rounded" />
        <Skeleton className="h-6 md:h-7 w-12 md:w-14 rounded" />
        <Skeleton className="h-6 md:h-7 w-16 md:w-20 rounded" />
      </div>
    </div>
  </div>
);

export const NavCardSkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <NavCardSkeleton key={i} />
    ))}
  </div>
);

export const PropertyCardSkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
    {Array.from({ length: 3 }).map((_, i) => (
      <PropertyCardSkeleton key={i} />
    ))}
  </div>
);
