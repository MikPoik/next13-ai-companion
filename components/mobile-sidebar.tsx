import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetTitle
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/sidebar";

export const MobileSidebar = ({
  isPro
}: {
  isPro: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="md:hidden pr-4">
        <Menu />
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 bg-secondary pt-10 w-32"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">
            Navigation Menu
          </SheetTitle>
          <SheetDescription className="sr-only">
            Mobile navigation sidebar menu
          </SheetDescription>
        </SheetHeader>
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