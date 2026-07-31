import Sidebar from "@/app/components/layout/sidebar";
import PageTransition from "@/app/components/ui/page-transition";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="pockit-dashboard-shell dashboard-texture relative flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(155deg, #edf3ff 0%, #f2f7ff 40%, #f8fbff 100%)" }}
    >
      <Sidebar />
      <main className="relative z-10 min-w-0 flex-1 overflow-y-auto p-7">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
