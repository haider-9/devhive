"use client";
import Link from "next/link";
import {
  LuHome,
  LuTrendingUp,
  LuBookmark,
  LuTag,
  LuUsers,
  LuSettings,
  LuLogOut,
  LuPlus,
  LuMessageCircle,
  LuInfo,
} from "react-icons/lu";
import { Avatar, Button } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavLink from "./NavLink";
import { account } from "@/appwrite";

const sideLinks = [
  { name: "Home", icon: <LuHome />, href: "/" },
  { name: "Trending", icon: <LuTrendingUp />, href: "/trending" },
  { name: "Bookmarks", icon: <LuBookmark />, href: "/bookmarks" },
  { name: "Topics", icon: <LuTag />, href: "/topics" },
  { name: "Communities", icon: <LuUsers />, href: "/communities" },
  { name: "About", icon: <LuInfo />, href: "/about" },
];

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // First try to get user from cookie
    try {
      const cookieValue = document.cookie.replace(
        /(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
      );
      
      if (cookieValue) {
        const userData = JSON.parse(cookieValue);
        setUser(userData);
      } else {
        // If no cookie, try to get user from Appwrite session
        fetchUserFromAppwrite();
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      // If error parsing cookie, try to get user from Appwrite session
      fetchUserFromAppwrite();
    }
  }, []);

  const fetchUserFromAppwrite = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      
      // Set the cookie for future use
      document.cookie = `user=${JSON.stringify(userData)}`;
    } catch (error) {
      console.error("Error fetching user from Appwrite:", error);
      // If we can't get the user from Appwrite, redirect to login
      router.push("/start");
    }
  };

  const handleLogout = async () => {
    try {
      // Delete the Appwrite session
      await account.deleteSession('current');
      
      // Clear the cookie
      document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      console.log("User logged out");
      setUser(null);
      router.push("/start");
    } catch (error) {
      console.error("Logout failed", error);
      // Even if the session deletion fails, still try to redirect
      router.push("/start");
    }
  };

  // If no user is found, don't render the sidebar
  if (!user) {
    return null;
  }

  return (
    <aside className="pb-8 text-foreground h-screen fixed top-6 left-6 w-20 lg:w-80 flex flex-col transition-all duration-300">
      <div className="flex-1 flex flex-col overflow-y-auto space-y-4">
        <div className="bg-secondary shadow-lg rounded-2xl p-4 lg:p-6 flex flex-col items-center gap-6">
          <Link href="/profile" className="w-full">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <Avatar
                src={
                  user?.avatarUrl ||
                  user?.prefs?.profileImageId ? 
                  `${process.env.NEXT_PUBLIC_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_BUCKET_ID}/files/${user.prefs.profileImageId}/view?project=${process.env.NEXT_PUBLIC_PROJECT_ID}` : 
                  "https://i.pravatar.cc/150?u=a042581f4e29026024d"
                }
                size="lg"
                radius="full"
                isBordered
                color="warning"
              />
              <div className="hidden lg:block overflow-hidden">
                <div className="font-semibold text-lg text-warning truncate">
                  {user?.name}
                </div>
                <div className="text-sm text-neutral-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
          </Link>
          <div className="flex gap-2 w-full">
            <Link
              href="/post/add"
              className="hidden grow p-3 rounded-xl bg-warning text-secondary lg:flex items-center justify-center gap-3"
            >
              <LuPlus className="text-xl" />
              New Post
            </Link>
            <Link
              href="/chats"
              className="p-3 rounded-xl bg-warning text-secondary flex items-center justify-center gap-3 flex-grow lg:flex-grow-0"
            >
              <LuMessageCircle className="text-xl" />
            </Link>
          </div>
        </div>

        <nav className="bg-secondary shadow-lg rounded-2xl flex-1 flex flex-col justify-start items-center gap-2 p-4">
          {sideLinks.map((item) => (
            <NavLink
              key={item.name}
              href={item.href}
              className="w-full p-3 flex items-center justify-center lg:justify-start gap-3 hover:bg-warning hover:text-primary rounded-xl transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="bg-secondary shadow-lg flex flex-col justify-center items-center rounded-2xl p-4">
          <Link
            href="/settings"
            className="w-full p-3 flex items-center justify-center lg:justify-start gap-3 hover:bg-warning hover:text-primary rounded-xl transition-colors"
          >
            <LuSettings className="text-xl" />
            <span className="hidden lg:inline">Settings</span>
          </Link>
          <Button
            color="danger"
            variant="light"
            startContent={<LuLogOut className="text-xl" />}
            className="w-full p-3 justify-center lg:justify-start mt-2"
            onClick={handleLogout}
          >
            <span className="hidden lg:inline">Log Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
