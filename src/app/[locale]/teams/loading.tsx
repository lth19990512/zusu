import { Skeleton } from "@/components/ui/skeleton";

export default function TeamsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse">
      <Skeleton className="h-10 w-32" />
      {[1, 2].map((conf) => (
        <div key={conf} className="space-y-4">
          <Skeleton className="h-8 w-24" />
          {[1, 2, 3].map((div) => (
            <div key={div}>
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
