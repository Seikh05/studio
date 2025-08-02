import { AppHeader } from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
