import { Home, NotebookTabs, PencilLine, Settings, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '../ui/sidebar';
import { SyncIndicator } from './sync-indicator';

type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: MenuItem[];
  isActive?: boolean;
};

type MenuItems = {
  navMain: MenuItem[];
  navBottom: MenuItem[];
};

const menuItems: MenuItems = {
  navMain: [
    {
      title: 'Dashbord',
      url: '/app',
      icon: Home,
    },
    {
      title: 'Accounts',
      url: '/app/accounts',
      icon: NotebookTabs,
    },
    {
      title: 'Transactions',
      url: '/app/transactions',
      icon: PencilLine,
    },
    {
      title: 'Settings',
      url: '/app/settings',
      icon: Settings,
    },
  ],
  navBottom: [
    // {
    //   title: 'Settings',
    //   url: '#',
    //   icon: Settings,
    // },
  ],
};

const LogoArea = () => (
  <SidebarMenuItem className="mb-4 flex flex-row gap-2">
    <Image
      src="/assets/images/icon0.svg"
      alt="logo"
      width={20}
      height={20}
      className="aspect-square size-10 rounded-lg"
    />
    <div className="text-md flex flex-col gap-1 leading-none">
      <span className="font-medium">Budget Tracker</span>
      <SyncIndicator />
    </div>
  </SidebarMenuItem>
);

export const AppSidebar = () => {
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  const handleToggleSidebar = () => {
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <Sidebar variant="inset" className="rounded-tr-lg rounded-br-md shadow-lg">
      <SidebarContent className="p-2">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <LogoArea />
              {menuItems.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={handleToggleSidebar} asChild>
                    <Link href={item.url}>
                      {item.icon ? <item.icon /> : <></>}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            isActive={item.isActive}
                            onClick={handleToggleSidebar}
                            asChild
                          >
                            <Link href={item.url}>{item.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Bottom */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.navBottom.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={handleToggleSidebar} asChild>
                    <Link href={item.url}>
                      {item.icon ? <item.icon /> : <></>}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            onClick={handleToggleSidebar}
                            isActive={item.isActive}
                            asChild
                          >
                            <Link href={item.url}>{item.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
