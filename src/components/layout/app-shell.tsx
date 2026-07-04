"use client";

import { Avatar } from "@/components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/dropdown";
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from "@/components/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/sidebar";
import { SidebarLayout, useSidebarLayout } from "@/components/sidebar-layout";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
  SparklesIcon,
  TicketIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { AuthMenu, type AuthMenuUser } from "@/components/auth/auth-menu";

function navCurrent(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/explore") {
    return pathname === "/explore" || pathname.startsWith("/explore/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemCollapsedClass(collapsed: boolean) {
  return collapsed ? "lg:justify-center lg:gap-0 lg:px-2" : undefined;
}

function labelCollapsedClass(collapsed: boolean) {
  return clsx(collapsed && "lg:sr-only");
}

function currentItemClass(active: boolean) {
  return (
    active &&
    "lg:[&_a]:bg-indigo-50/90 lg:[&_a]:shadow-sm lg:[&_a]:ring-1 lg:[&_a]:ring-indigo-200/50 lg:[&_a]:*:data-[slot=icon]:fill-indigo-700"
  );
}

function AppSidebarRail({ user }: { user: AuthMenuUser | null }) {
  const { sidebarCollapsed: c, toggleSidebar } = useSidebarLayout();
  const pathname = usePathname() ?? "";
  const dash = navCurrent(pathname, "/dashboard");
  const profile = navCurrent(pathname, "/profile");
  const explore = navCurrent(pathname, "/explore");
  const decks = navCurrent(pathname, "/decks");
  const study = navCurrent(pathname, "/study");

  return (
    <Sidebar
      className={clsx(
        "h-full border-r border-[var(--app-surface-border)]",
        "bg-[var(--app-surface)] text-[var(--app-foreground)]",
        "shadow-[6px_0_32px_-16px_rgba(15,23,42,0.12)]"
      )}
    >
      <SidebarHeader className="border-zinc-200/80 bg-white/40 pb-3 backdrop-blur-sm">
        <Dropdown>
          <DropdownButton
            as={SidebarItem}
            className={clsx("mb-2.5 lg:mb-2.5", itemCollapsedClass(c))}
            title="Workspace"
          >
            <Avatar initials="RC" alt="Recall" className="bg-indigo-600 text-white shadow-sm ring-2 ring-white" />
            <SidebarLabel className={labelCollapsedClass(c)}>Recall</SidebarLabel>
            <ChevronDownIcon data-slot="icon" className={clsx(c && "lg:hidden")} />
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="bottom start">
            <DropdownItem href="/dashboard">
              <HomeIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Dashboard</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/decks">
              <RectangleStackIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Decks</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/pricing">
              <MegaphoneIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Pricing</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </SidebarHeader>
      <SidebarBody className="[&>[data-slot=section]+[data-slot=section]]:mt-6">
        <SidebarSection>
          <SidebarItem
            href="/dashboard"
            current={dash}
            className={clsx(itemCollapsedClass(c), currentItemClass(dash))}
            title="Dashboard"
          >
            <HomeIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Dashboard</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/decks"
            current={decks}
            className={clsx(itemCollapsedClass(c), currentItemClass(decks))}
            title="Decks"
          >
            <RectangleStackIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Decks</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/explore"
            current={explore}
            className={clsx(itemCollapsedClass(c), currentItemClass(explore))}
            title="Explore"
          >
            <GlobeAltIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Explore</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/study"
            current={study}
            className={clsx(itemCollapsedClass(c), currentItemClass(study))}
            title="Study"
          >
            <SparklesIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Study</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
        <SidebarSection>
          <SidebarHeading className={clsx("font-semibold tracking-wide text-zinc-400", c && "lg:hidden")}>
            Quick
          </SidebarHeading>
          <SidebarItem
            href="/decks#quick-create"
            className={clsx(
              "text-indigo-700 data-hover:bg-indigo-50 data-hover:*:data-[slot=icon]:fill-indigo-700",
              itemCollapsedClass(c)
            )}
            title="New deck"
          >
            <PlusIcon data-slot="icon" className="size-5 fill-indigo-600" />
            <SidebarLabel className={labelCollapsedClass(c)}>New deck</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
        <SidebarSpacer />
        <SidebarSection>
          <SidebarItem href="/contact" className={itemCollapsedClass(c)} title="Contact">
            <TicketIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Contact</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/pricing" className={itemCollapsedClass(c)} title="Pricing">
            <MegaphoneIcon data-slot="icon" className="size-5" />
            <SidebarLabel className={labelCollapsedClass(c)}>Pricing</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
      <SidebarFooter className="border-[var(--app-surface-border)] bg-[var(--app-surface)]/80 backdrop-blur-sm">
        <div className={clsx("mb-3 px-1", c && "lg:px-0")}>
          <AuthMenu user={user} variant="sidebar" />
        </div>
        <SidebarItem
          type="button"
          onClick={toggleSidebar}
          aria-label={c ? "Expand sidebar" : "Collapse sidebar"}
          className={clsx(
            "text-zinc-500 data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:fill-zinc-700",
            itemCollapsedClass(c)
          )}
          title={c ? "Expand sidebar" : "Collapse sidebar"}
        >
          {c ? (
            <ChevronDoubleRightIcon data-slot="icon" className="size-5" />
          ) : (
            <ChevronDoubleLeftIcon data-slot="icon" className="size-5" />
          )}
          <SidebarLabel className={labelCollapsedClass(c)}>Collapse</SidebarLabel>
        </SidebarItem>
        <SidebarItem href="#top" className={itemCollapsedClass(c)} title="Back to top">
          <ChevronUpIcon data-slot="icon" className="size-5" />
          <SidebarLabel className={labelCollapsedClass(c)}>Back to top</SidebarLabel>
        </SidebarItem>
        <SidebarItem href="/contact" className={itemCollapsedClass(c)} title="Help">
          <QuestionMarkCircleIcon data-slot="icon" className="size-5" />
          <SidebarLabel className={labelCollapsedClass(c)}>Help</SidebarLabel>
        </SidebarItem>
        <SidebarItem
          href="/profile"
          current={profile}
          className={itemCollapsedClass(c)}
          title="Profile"
        >
          <UserIcon data-slot="icon" className="size-5" />
          <SidebarLabel className={labelCollapsedClass(c)}>Profile</SidebarLabel>
        </SidebarItem>
        <SidebarItem
          href="/dashboard"
          current={dash}
          className={itemCollapsedClass(c)}
          title="Settings"
        >
          <Cog6ToothIcon data-slot="icon" className="size-5" />
          <SidebarLabel className={labelCollapsedClass(c)}>Settings</SidebarLabel>
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthMenuUser | null;
}) {
  const navbar = (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href="/decks" aria-label="Search decks">
          <MagnifyingGlassIcon data-slot="icon" className="size-5" />
        </NavbarItem>
        <NavbarItem href="/dashboard" aria-label="Inbox">
          <InboxIcon data-slot="icon" className="size-5" />
        </NavbarItem>
        <AuthMenu user={user} variant="navbar" />
      </NavbarSection>
    </Navbar>
  );

  return (
    <SidebarLayout
      navbar={navbar}
      sidebar={<AppSidebarRail user={user} />}
      desktopHeader={<AuthMenu user={user} variant="compact" />}
    >
      {children}
    </SidebarLayout>
  );
}
