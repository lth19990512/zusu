import { Skeleton } from "@/components/ui/skeleton";

export default function GameDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-pulse">
      <Skeleton className="h-[160px] rounded-2xl" />
      <Skeleton className="h-4 w-48 mx-auto" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-2xl" />
    </div>
  );
}
