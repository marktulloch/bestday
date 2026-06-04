export function DashboardSkeleton() {
  return (
    <div className="max-w-[1120px] mx-auto px-6 lg:px-8 py-10 md:py-14 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-72 bg-gray-100 rounded mb-10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-xl border border-gray-100 bg-gray-50"
          />
        ))}
      </div>
    </div>
  );
}
