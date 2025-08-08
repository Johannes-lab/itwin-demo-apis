import * as React from "react"
import {
  Database,
  Layers3,
  Settings,
  HelpCircle,
  Building2,
} from "lucide-react"

import { NavSecondary } from "@/components/ui/nav-secondary"
import { NavUser } from "@/components/ui/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "iTwin User",
    email: "user@bentley.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "iTwin Data",
      url: "#",
      icon: Database,
    },
    {
      title: "Reality Modeling",
      url: "#",
      icon: Layers3,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircle,
    },
  ],
  documents: [],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView?: 'auth' | 'reality-modeling';
  setActiveView?: (view: 'auth' | 'reality-modeling') => void;
  userProfile?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppSidebar({ 
  activeView = 'auth', 
  setActiveView, 
  userProfile,
  ...props 
}: AppSidebarProps) {
  const navItems = [
    {
      title: "iTwin Data",
      url: "#",
      icon: Database,
      onClick: () => setActiveView?.('auth'),
      isActive: activeView === 'auth',
    },
    {
      title: "Reality Modeling",
      url: "#",
      icon: Layers3,
      onClick: () => setActiveView?.('reality-modeling'),
      isActive: activeView === 'reality-modeling',
    },
  ];

  const userData = userProfile || {
    name: "iTwin User",
    email: "user@bentley.com",
    avatar: "/avatars/user.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Building2 className="!size-5" />
                <span className="text-base font-semibold">iTwin Demo Portal</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="space-y-2">
          {navItems.map((item) => (
            <SidebarMenu key={item.title}>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={item.onClick}
                  isActive={item.isActive}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ))}
        </div>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
