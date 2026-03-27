"use client";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-[100%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent w-full" style={{ willChange: "transform" }} />
    </div>
  );
}

export function ExperienceSkeleton() {
  return (
    <div className="rounded-[32px] border border-black bg-white p-6 space-y-6">
       <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-sm" />
       </div>
       <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-3 w-56 rounded-sm opacity-60" />
       </div>
       <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
       </div>
       <Skeleton className="h-16 w-full rounded-xl" />
       <div className="flex justify-between pt-4 border-t border-black/5">
          <Skeleton className="h-4 w-20 rounded-full" />
          <div className="flex gap-2">
             <Skeleton className="h-8 w-8 rounded-lg" />
             <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
       </div>
    </div>
  );
}
