import { Database, Drone } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from './ui/sidebar';

// Navigation items for the sidebar
const items = [
  {
    title: "My iTwins",
    url: "#",
    icon: Database,
    view: 'my-itwins' as const
  },
  {
    title: "Reality Modeling",
    url: "#",
    icon: Drone,
    view: 'reality-modeling' as const
  },
];

export type ViewType = 'my-itwins' | 'reality-modeling';

interface AppSidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

function AppSidebar({ activeView, setActiveView }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2 className="font-semibold text-lg">iTwin Demo Portal</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => setActiveView(item.view)}
                    isActive={activeView === item.view}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
