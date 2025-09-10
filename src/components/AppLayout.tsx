import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { ModeToggle } from './ui/mode-toggle';
import AppSidebar from './AppSidebar';
import UserProfile from './UserProfile';
import { Outlet } from 'react-router-dom';

function AppLayout() {
  return (
    <SidebarProvider>
    <AppSidebar />
      <main className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <UserProfile />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
      <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}

export default AppLayout;
