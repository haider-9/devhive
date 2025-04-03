"use client";
import { account } from "@/appwrite";
import FeedSection from "@/components/FeedSection";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";
import { useEffect, useState } from "react";

const Homepage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get();
        if (user) {
          setIsAuthenticated(true);
        } else {
          router.replace("/start");
        }
      } catch (error) {
        console.log("Not authenticated:", error);
        router.replace("/start");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // Show loading state or redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-info"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="relative">
      <FeedSection />
      <Link href="/post/add" className="group fixed bottom-6 right-6 z-50">
        <div className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-warning to-info text-white shadow-2xl group transition-all duration-300 hover:from-info hover:to-warning hover:pr-4">
          <div className="flex h-16 w-16 transform items-center justify-center transition-transform duration-500 group-hover:scale-90">
            <LuPlus className="h-8 w-8 group-hover:rotate-45 transition-all duration-100" />
          </div>
          <div className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-500 group-hover:max-w-xs group-hover:opacity-100">
            Create Post
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Homepage;
