"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { FolderOpen, PenSquare, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useChat } from "@/contexts/ChatContext";
import { useHttp } from "@/contexts/HttpProvider";
import { useToast } from "@/contexts/ToastContext";

export function AppSidebar() {
  const { sessions, activeSession, newChat, setActiveSessionId } = useChat();
  const { post, postWithFormData } = useHttp();
  const { toast, dismiss } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        await postWithFormData("/client/embed", { files: file });
      }
      toast(`${files.length > 1 ? `${files.length} documents` : files[0].name} uploaded successfully.`);
    } catch {
      toast("Failed to upload document.", "error");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleScrape = async () => {
    const domain = url.trim();
    if (!domain) return;
    setScraping(true);
    const loadingId = toast(`Scraping '${domain}'…`, "loading");
    try {
      await post("/client/scrape-website", { domain });
      dismiss(loadingId);
      toast(`'${domain}' scraped and embedded successfully.`);
      setUrl("");
    } catch {
      dismiss(loadingId);
      toast("Failed to start website scraping.", "error");
    } finally {
      setScraping(false);
    }
  };

  return (
    <Sidebar className="bg-surface-alt">
      {/* Header */}
      <SidebarHeader className="bg-surface-alt px-4 pt-6 pb-4 gap-3">
        <span className="font-title text-[48px] font-medium text-center">PEN</span>

        <div className="flex gap-2">
          <input
            className="h-[40px] w-full p-2 bg-surface border border-primary-light rounded-[20px] shadow-md font-light text-base"
            placeholder="www.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="flex items-center justify-center h-[40px] w-[56px] shrink-0 bg-surface border border-primary-light rounded-[20px] shadow-md disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || scraping}
            title="Upload PDF"
          >
            <Upload size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files);
            }}
          />
        </div>

        <button
          disabled={loading || scraping}
          onClick={url.trim() ? handleScrape : () => fileInputRef.current?.click()}
          className="h-[40px] w-full font-semibold text-surface bg-primary border border-primary-light rounded-full shadow-md disabled:opacity-50"
        >
          {scraping ? "Scraping..." : loading ? "Uploading..." : "Add"}
        </button>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="bg-surface-alt px-2">

        {/* New Chat */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="flex font-normal text-[16px] hover:bg-primary-light/20" onClick={() => { newChat(); router.push("/chat"); }}>
                <PenSquare size={16} />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Your Chats */}
        {sessions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-text font-normal">Your chats</SidebarGroupLabel>
            <SidebarGroupContent className="max-h-[180px] overflow-y-auto">
              <SidebarMenu>
                {sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      className="text-text font-normal text-[16px] hover:bg-primary-light/20 data-[active=true]:bg-primary-light/20"
                      isActive={pathname === "/chat" && activeSession?.id === session.id}
                      onClick={() => { setActiveSessionId(session.id); router.push("/chat"); }}
                    >
                      <span className="truncate">{session.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-text-mid font-light text-[16px]">Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-text font-normal text-[16px] hover:bg-primary-light/20 data-[active=true]:bg-primary-light/20"
                  isActive={pathname === "/chat/manage-documents"}
                  onClick={() => router.push("/chat/manage-documents")}
                >
                  <FolderOpen size={16} />
                  <span>Manage Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
