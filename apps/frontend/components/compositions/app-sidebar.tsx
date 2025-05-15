import { Home, NotebookTabs, PencilLine, Settings, type LucideIcon } from 'lucide-react';
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
} from '../ui/sidebar';

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

export const AppSidebar = () => {
  return (
    <Sidebar variant="inset">
      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      {item.icon ? <item.icon /> : <></>}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={item.isActive}>
                            <a href={item.url}>{item.title}</a>
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
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      {item.icon ? <item.icon /> : <></>}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={item.isActive}>
                            <a href={item.url}>{item.title}</a>
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
