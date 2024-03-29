import type { FC, ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "@/common/lib/utils";

import { Button, Input, UserAvatar } from "@/components";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { SideMenuLinks } from "./data";
import { HashtagsList, MenuItems } from "./fragments";

interface AppLayoutProps {
  children: ReactNode;
  user: IUser | null;
  hideHeader?: boolean;
  searchPath?: string;
}

const AppLayout: FC<AppLayoutProps> = ({
  user,
  children,
  searchPath = "/search/twats",
  ...props
}) => {
  const router = useRouter();
  const selectedTab = SideMenuLinks.get(router.asPath);
  const renderMenuItems = MenuItems(router, user);

  return (
    <main className="mx-auto grid max-w-screen-xl grid-cols-12">
      <aside className="sticky left-0 top-0 col-span-1 flex h-screen flex-col justify-between border-r border-r-gray-300 p-2 dark:border-r-neutral-600 md:col-span-2">
        <div className="">
          <Link href="/" className="w-fit">
            <div className="relative h-8 w-8 md:h-20 md:w-20">
              <Image fill alt="twtar logo" src="/logo.svg" />
            </div>
          </Link>
          <ul className="flex h-full flex-col gap-y-2">{renderMenuItems}</ul>
        </div>

        {!!user ? (
          <div className="inline-flex w-full items-center justify-between">
            <UserAvatar size="sm" src={user.image} />
            <Button
              onClick={() => {
                void import("next-auth/react").then(
                  ({ signOut }) => void signOut()
                );
              }}
              className="hidden gap-x-2 bg-red-500 hover:bg-red-600 md:inline-flex lg:inline-flex"
            >
              <span className="hidden lg:block">Logout</span>
              <FiLogOut />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full justify-center text-lg md:inline-flex"
            onClick={() => void signIn()}
          >
            <span className="hidden md:block">Login</span>
            <FiLogIn />
          </Button>
        )}
      </aside>

      <div className="col-span-11 md:col-span-10 lg:col-span-8">
        {!props.hideHeader && (
          <div className="sticky top-0 z-50 border-b border-b-gray-300 bg-opacity-25 p-4 font-bold backdrop-blur-md  dark:border-b-neutral-600 dark:bg-opacity-0">
            {selectedTab?.label}
          </div>
        )}
        <div>{children}</div>
      </div>
      <aside className="sticky right-0 top-0 col-span-2 hidden h-screen border-l border-gray-300 p-4 dark:border-neutral-600 lg:block">
        <form action={searchPath}>
          <Input placeholder="search ..." name="q" className="w-full" />
        </form>
        <HashtagsList />
      </aside>
    </main>
  );
};

export default AppLayout;
