import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { ModeToggle } from './ui/mode-toggle';
import AppSidebar, { type ViewType } from './AppSidebar';
import UserProfile from './UserProfile';
import MyiTwinsComponent from './MyiTwinsComponent';
import RealityModelingComponent from './RealityModelingComponent';

function AppLayout() {
  const [activeView, setActiveView] = useState<ViewType>('my-itwins');

  const renderActiveView = () => {
    switch (activeView) {
      case 'my-itwins':
        return <MyiTwinsComponent />;
      case 'reality-modeling':
        return <RealityModelingComponent />;
      default:
        return <MyiTwinsComponent />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <UserProfile />
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderActiveView()}
        </div>
      </main>
    </SidebarProvider>
  );
}

export default AppLayout;
