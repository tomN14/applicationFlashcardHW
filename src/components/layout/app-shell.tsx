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
  Cog8ToothIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Cog6ToothIcon,
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

function navCurrent(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
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

function AppSidebarRail() {
  const { sidebarCollapsed: c, toggleSidebar } = useSidebarLayout();
  const pathname = usePathname() ?? "";
  const dash = navCurrent(pathname, "/dashboard");
  const decks = navCurrent(pathname, "/decks");
  const study = navCurrent(pathname, "/study");

  return (
    <Sidebar
      className={clsx(
        "h-full border-r border-zinc-200/90",
        "bg-gradient-to-b from-white via-zinc-50/40 to-zinc-100/80",
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
      <SidebarFooter className="border-zinc-200/80 bg-white/30 backdrop-blur-sm">
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
        <SidebarItem href="/dashboard" className={itemCollapsedClass(c)} title="Settings">
          <Cog6ToothIcon data-slot="icon" className="size-5" />
          <SidebarLabel className={labelCollapsedClass(c)}>Settings</SidebarLabel>
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
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
        <Dropdown>
          <DropdownButton as={NavbarItem}>
            <Avatar initials="You" alt="Account" className="bg-zinc-200 text-zinc-700" square />
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="bottom end">
            <DropdownItem href="/dashboard">
              <UserIcon data-slot="icon" className="size-5" />
              <DropdownLabel>My profile</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/dashboard">
              <Cog8ToothIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/pricing">
              <ShieldCheckIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Plans</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/contact">
              <LightBulbIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Share feedback</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/">
              <ArrowRightStartOnRectangleIcon data-slot="icon" className="size-5" />
              <DropdownLabel>Home</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  );

  return (
    <SidebarLayout navbar={navbar} sidebar={<AppSidebarRail />}>
      {children}
    </SidebarLayout>
  );
}
