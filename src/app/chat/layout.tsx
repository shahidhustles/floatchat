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
} from "@/lib/convex/convex-chat-context";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

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

//TODO : add loading state when teh chat session are loading
function ChatSessionMenu({ sessionId }: { sessionId: string }) {
  const { deleteSession } = useChatSessions();
  const router = useRouter();

  const handleDelete = async () => {
    await deleteSession(sessionId);
    router.push("/chat");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-800"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-blue-200 bg-white">
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatSidebar() {
  const { user } = useUser();
  const { sessions } = useChatSessions();
  const router = useRouter();
  const params = useParams();

  const handleNewChat = () => {
    //TODO : change this when you have implemented the first message functionality.
    router.push(`/chat`);
  };

  const currentChatId = params?.chatId as string;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-blue-100 bg-gradient-to-b from-blue-50/50 to-cyan-50/30"
    >
      <SidebarHeader className="border-b border-blue-100/50">
        <div className="flex items-center gap-2 px-1 py-2 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/icons/logo.png"
            alt="Logo"
            width={24}
            height={24}
            className="h-12 w-12 object-contain"
          />

          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden text-blue-900">
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
              className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-md border-0"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                New Chat
              </span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-blue-100" />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === "/chat" && !currentChatId}
                    className="hover:bg-blue-100/50 data-[active=true]:bg-blue-200/60 data-[active=true]:text-blue-900"
                  >
                    <Link href={item.href} className="text-blue-800">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-blue-100" />

        {/* Recent Chats */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-blue-700 font-medium">
            <History className="h-4 w-4" />
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions?.map((session) => {
                const isActive = Boolean(
                  currentChatId &&
                    session.chatId &&
                    currentChatId === session.chatId
                );

                return (
                  <SidebarMenuItem key={session._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="hover:bg-blue-100/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-200/80 data-[active=true]:to-cyan-200/60 data-[active=true]:border-l-2 data-[active=true]:border-blue-500"
                    >
                      <Link
                        href={`/chat/${session.chatId}`}
                        className="flex items-center gap-2 pr-8 relative p-2 group-data-[collapsible=icon]:hidden w-full"
                      >
                        <span className="font-medium text-sm truncate w-full text-blue-900 data-[active=true]:text-blue-950">
                          {session.title}
                        </span>
                        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChatSessionMenu sessionId={session.chatId} />
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }) || []}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-blue-100/50 bg-blue-50/30">
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
                  <span className="text-sm font-medium truncate text-blue-900">
                    {user?.firstName}
                  </span>
                  <span className="text-xs text-blue-600">
                    {user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                  >
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
              <SidebarTrigger className="bg-blue-50/90 hover:bg-blue-100/90 backdrop-blur-sm shadow-md border border-blue-200/50 text-blue-700 hover:text-blue-900" />
            </div>
            <main className="h-full overflow-hidden">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ChatSessionProvider>
  );
}
