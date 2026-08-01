export default function DashboardLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2"><div className="skeleton h-3 w-28" /><div className="skeleton h-8 w-52" /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((index) => <div key={index} className="skeleton h-44 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
      <div className="skeleton h-56 rounded-2xl" />
    </div>
  );
}
