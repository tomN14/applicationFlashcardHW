'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { NavbarItem } from './navbar'

const SIDEBAR_COLLAPSED_KEY = 'recall.sidebarCollapsed'

type SidebarLayoutContextValue = {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null)

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext)
  if (!ctx) {
    throw new Error('useSidebarLayout must be used within SidebarLayout')
  }
  return ctx
}

function OpenMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  )
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}

function MobileSidebar({ open, close, children }: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/5">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  )
}

export function SidebarLayout({
  navbar,
  sidebar,
  desktopHeader,
  children,
}: React.PropsWithChildren<{
  navbar: React.ReactNode
  sidebar: React.ReactNode
  desktopHeader?: React.ReactNode
}>) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
        setSidebarCollapsed(true)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c)
  }, [])

  const layoutCtx = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
    }),
    [sidebarCollapsed, toggleSidebar]
  )

  return (
    <SidebarLayoutContext.Provider value={layoutCtx}>
      <div className="relative isolate flex min-h-svh w-full bg-[var(--app-background)] max-lg:flex-col">
        {/* Sidebar on desktop */}
        <div
          className={clsx(
            'fixed inset-y-0 left-0 z-30 max-lg:hidden overflow-hidden transition-[width] duration-300 ease-out',
            sidebarCollapsed ? 'w-[4.5rem]' : 'w-64'
          )}
        >
          {sidebar}
        </div>

        {/* Sidebar on mobile */}
        <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
          {sidebar}
        </MobileSidebar>

        {/* Navbar on mobile */}
        <header className="flex items-center border-b border-zinc-950/5 bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <div className="py-2.5">
            <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
              <OpenMenuIcon />
            </NavbarItem>
          </div>
          <div className="min-w-0 flex-1">{navbar}</div>
        </header>

        {/* Content */}
        <main
          className={clsx(
            'flex flex-1 flex-col pb-2 transition-[padding] duration-300 ease-out lg:min-w-0 lg:pt-2 lg:pr-2',
            sidebarCollapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'
          )}
        >
          {desktopHeader ? (
            <div className="hidden shrink-0 justify-end px-4 pt-3 sm:px-6 lg:flex lg:px-8">
              {desktopHeader}
            </div>
          ) : null}
          <div className="grow p-4 sm:p-6 lg:rounded-xl lg:bg-[var(--app-surface)] lg:p-8 lg:text-[var(--app-foreground)] lg:shadow-sm lg:ring-1 lg:ring-[var(--app-surface-border)]">
            <div className="mx-auto max-w-6xl">{children}</div>
          </div>
        </main>
      </div>
    </SidebarLayoutContext.Provider>
  )
}
