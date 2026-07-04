"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { displayInitials } from "@/lib/auth/display-initials";
import { Avatar } from "@/components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/dropdown";
import { NavbarItem } from "@/components/navbar";
import {
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/16/solid";

export type AuthMenuUser = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
};

type AuthMenuProps = {
  user: AuthMenuUser | null;
  variant?: "navbar" | "sidebar" | "compact";
};

function UserAvatar({
  user,
  className,
  square,
}: {
  user: AuthMenuUser;
  className?: string;
  square?: boolean;
}) {
  return (
    <Avatar
      data-slot="avatar"
      src={user.avatarUrl}
      initials={displayInitials(user.username)}
      alt={user.username}
      className={className}
      square={square}
    />
  );
}

export function AuthMenu({ user, variant = "navbar" }: AuthMenuProps) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  if (!user) {
    if (variant === "sidebar") {
      return (
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Sign up
          </Link>
        </div>
      );
    }
    const authLinks = (
      <>
        <NavbarItem href="/signup" className="!px-3 !py-1.5">
          <span className="text-sm font-semibold text-indigo-700">Sign up</span>
        </NavbarItem>
        <NavbarItem href="/login" className="!px-3 !py-1.5">
          <span className="text-sm font-semibold text-zinc-700">Sign in</span>
        </NavbarItem>
      </>
    );

    if (variant === "compact") {
      return (
        <div className="flex shrink-0 items-center gap-2">{authLinks}</div>
      );
    }

    return authLinks;
  }

  const handleSignOut = () => {
    startSignOut(async () => {
      try {
        await signOut();
      } catch {
        router.refresh();
      }
    });
  };

  const compactTriggerClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-white/90 px-1.5 py-1 text-left shadow-sm transition hover:bg-zinc-50 disabled:opacity-60";

  const trigger =
    variant === "navbar" ? (
      <DropdownButton
        as={NavbarItem}
        disabled={signingOut}
        className="!gap-1 !px-1.5 !py-1 shrink-0"
      >
        <UserAvatar
          user={user}
          className="size-6 bg-indigo-600 text-[0.65rem] text-white"
          square
        />
        <span className="hidden max-w-[4.5rem] truncate text-xs font-medium text-zinc-800 sm:inline">
          {user.username}
        </span>
      </DropdownButton>
    ) : variant === "compact" ? (
      <DropdownButton
        className={compactTriggerClass}
        disabled={signingOut}
        aria-label="Account menu"
      >
        <UserAvatar
          user={user}
          className="size-6 bg-indigo-600 text-[0.65rem] text-white"
          square
        />
        <span className="max-w-[5rem] truncate text-xs font-medium text-zinc-800">
          {user.username}
        </span>
      </DropdownButton>
    ) : (
      <DropdownButton
        className="flex w-full items-center gap-2 rounded-lg bg-[var(--app-sidebar-user-bg)] px-2 py-2 text-left text-sm text-[var(--app-sidebar-user-text)] transition hover:opacity-90"
        disabled={signingOut}
      >
        <UserAvatar
          user={user}
          className="size-8 bg-[var(--app-accent)] text-[var(--app-surface)]"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-[var(--app-sidebar-user-text)]">
          {user.username}
        </span>
      </DropdownButton>
    );

  const decksLink =
    variant === "navbar" ? (
      <NavbarItem href="/decks" className="!px-3 !py-1.5">
        <span className="text-sm font-semibold text-indigo-700">Decks</span>
      </NavbarItem>
    ) : (
      <Link
        href="/decks"
        className="inline-flex shrink-0 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
      >
        Decks
      </Link>
    );

  const profileMenu = (
    <Dropdown>
      {trigger}
      <DropdownMenu className="min-w-64" anchor="bottom end">
        <div className="border-b border-zinc-100 px-3 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              className="size-10 bg-indigo-600 text-white"
              square
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {user.username}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
        </div>
        <DropdownItem href="/profile">
          <UserCircleIcon data-slot="icon" className="size-5" />
          <DropdownLabel>Profile</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem onClick={handleSignOut} disabled={signingOut}>
          <ArrowRightStartOnRectangleIcon
            data-slot="icon"
            className="size-5"
          />
          <DropdownLabel>
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownLabel>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );

  if (variant === "sidebar") {
    return profileMenu;
  }

  return (
    <div
      className={
        variant === "compact"
          ? "flex shrink-0 items-center gap-2"
          : "flex items-center gap-1"
      }
    >
      {decksLink}
      {profileMenu}
    </div>
  );
}
