"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  MessageSquare,
  Plus,
  History,
  FileText,
  Upload,
  BarChart3,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatSessionProvider,
  useChatSessions,
} from "@/lib/chat-session-context";
import { useRouter, useParams } from "next/navigation";

// Navigation items for the sidebar
const navItems = [
  {
    title: "Chat",
    icon: MessageSquare,
    href: "/chat",
    isActive: true,
  },
  {
    title: "Dashboard",
    icon: BarChart3,
    href: "/dashboard",
  },
  {
    title: "Upload Data",
    icon: Upload,
    href: "/upload",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
  },
];

function ChatSessionMenu({ sessionId }: { sessionId: string }) {
  const { deleteSession } = useChatSessions();
  const router = useRouter();

  const handleDelete = () => {
    deleteSession(sessionId);
    router.push("/chat");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatSidebar() {
  const { user } = useUser();
  const { sessions, createNewSession } = useChatSessions();
  const router = useRouter();
  const params = useParams();

  const handleNewChat = () => {
    const newSession = createNewSession();
    router.push(`/chat/${newSession.id}`);
  };

  const currentChatId = params?.chatId as string;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center px-2">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            FloatChat
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                New Chat
              </span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === "/chat" && !currentChatId}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Recent Chats */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((session) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentChatId === session.id}
                  >
                    <Link
                      href={`/chat/${session.id}`}
                      className="flex items-center gap-2 pr-8 relative p-2 group-data-[collapsible=icon]:hidden w-full"
                    >
                      <span className="font-medium text-sm truncate w-full text-gray-900 dark:text-gray-100">
                        {session.title}
                      </span>
                      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChatSessionMenu sessionId={session.id} />
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignedIn>
              <div className="flex items-center gap-2 px-2 py-1">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate">
                    {user?.firstName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="w-full">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatSessionProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <ChatSidebar />
          <SidebarInset className="flex-1">
            <div className="absolute top-4 left-4 z-50">
              <SidebarTrigger className="bg-white/80 hover:bg-white/90 backdrop-blur-sm shadow-md" />
            </div>
            <main className="h-full overflow-hidden">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ChatSessionProvider>
  );
}
