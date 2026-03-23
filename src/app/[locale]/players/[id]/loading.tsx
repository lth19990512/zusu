import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerLoading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Hero banner skeleton */}
      <Skeleton className="h-[260px] rounded-2xl" />
      {/* Bio */}
      <Skeleton className="h-[200px] rounded-2xl" />
      {/* Stats */}
      <Skeleton className="h-[120px] rounded-2xl" />
      {/* Shot chart */}
      <Skeleton className="h-[500px] rounded-2xl" />
    </div>
  );
}
