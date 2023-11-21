import { useSession } from "next-auth/react";
import FolderIcon from "@/components/shared/icons/folder";
import DataRoomIcon from "@/components/shared/icons/data-room";
import PieChartIcon from "@/components/shared/icons/pie-chart";
import SettingsIcon from "@/components/shared/icons/settings";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import LoadingSpinner from "./../../ui/loading-spinner";
import { useState, useEffect } from "react";
import { FolderDirectory } from "@/lib/types";

export default function NavigationBar({
  folderDirectory
}: {
  folderDirectory: FolderDirectory
}) {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBottom, setIsBottom] = useState(true);

  const router = useRouter();

  const navigation = [
    // {
    //   name: "Overview",
    //   href: "/overview",
    //   icon: HomeIcon,
    //   current: router.pathname.includes("overview"),
    //   disabled: true,
    // },
    {
      name: "Documents",
      href: "/documents",
      icon: FolderIcon,
      current: router.pathname.includes("documents"),
      disabled: false,
    },
    {
      name: "Data Rooms",
      href: "/datarooms",
      icon: DataRoomIcon,
      current: router.pathname.includes("datarooms"),
      disabled: false,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: PieChartIcon,
      current: router.pathname.includes("analytics"),
      disabled: true,
    },
    {
      name: "Settings",
      href: "/settings/domains",
      icon: SettingsIcon,
      current: router.pathname.includes("settings"),
      disabled: false,
    },
  ];

  //Dynamically increase size of navigation bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition >= 50);
      const bottomThreshold = document.body.scrollHeight - window.innerHeight - 2;
      setIsBottom(scrollPosition >= bottomThreshold);
    };

    // Add the event listener
    window.addEventListener('scroll', handleScroll);

    // Remove the event listener on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isBottom, setIsBottom, setIsScrolled]);

  if (status === "loading") return <LoadingSpinner className="mr-1 h-5 w-5" />;

  return (
    <>
      {/* Static sidebar for desktop */}
      <div className={`hidden lg:fixed lg:z-0 lg:flex lg:w-72 lg:flex-col ${isBottom ? 'bottom-2' : 'bottom-0'} ${isScrolled ? 'h-full' : 'h-4/5'}`}>
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-50 dark:bg-gray-800 px-6 rounded-md">
          <div className="flex h-16 shrink-0 items-center">
            <p className="text-2xl font-bold tracking-tighter text-black dark:text-white flex items-center">
              Papermark{" "}
            </p>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => router.push(item.href)}
                        className={cn(
                          item.current
                            ? "bg-gray-200 dark:bg-secondary text-secondary-foreground font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-gray-200 hover:dark:bg-muted",
                          "group flex gap-x-3 items-center rounded-md p-2 text-sm leading-6 w-full disabled:hover:bg-transparent disabled:text-muted-foreground disabled:cursor-default"
                        )}
                        disabled={item.disabled}
                      >
                        <item.icon
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}