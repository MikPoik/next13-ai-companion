import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

export const MobileSidebar = ({
  isPro
}: {
  isPro: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close the sidebar when the pathname changes
    setIsOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="md:hidden pr-4" onClick={() => setIsOpen(true)}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-secondary pt-10 w-32">
        <Sidebar isPro={isPro} />
      </SheetContent>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </Sheet>
  );
};