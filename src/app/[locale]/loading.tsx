import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="container mx-auto px-4 py-5 space-y-5 animate-pulse">
      {/* Hero skeleton */}
      <Skeleton className="h-[280px] rounded-2xl" />

      {/* Scores + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <Skeleton className="h-[350px] rounded-2xl" />
        <div className="hidden lg:flex flex-col gap-4">
          <Skeleton className="h-[250px] rounded-2xl" />
          <Skeleton className="h-[200px] rounded-2xl" />
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}
