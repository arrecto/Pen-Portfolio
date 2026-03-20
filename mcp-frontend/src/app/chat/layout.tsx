import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatProvider } from "@/contexts/ChatContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col flex-1 min-h-screen">
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </ChatProvider>
  );
}
