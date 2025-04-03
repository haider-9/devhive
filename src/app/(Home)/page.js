import FeedSection from '@/components/FeedSection';
import Link from 'next/link';
import { LuPlus } from 'react-icons/lu';

const Homepage = () => {
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
