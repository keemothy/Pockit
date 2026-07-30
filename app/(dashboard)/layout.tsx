import Sidebar from "@/app/components/layout/sidebar";
import PageTransition from "@/app/components/ui/page-transition";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
