import { Skeleton } from "@/components/ui/skeleton";

export default function TeamDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 animate-pulse">
      <Skeleton className="h-[180px] rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[350px] rounded-2xl" />
    </div>
  );
}
