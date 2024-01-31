    "use client";

    import { useEffect, useState } from "react";
    import {  useRouter } from "next/navigation";

    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
    } from "@/components/ui/dialog"
    import { useProModal } from "@/hooks/use-pro-modal";
    import { Button } from "@/components/ui/button";
    import { Separator } from "@/components/ui/separator";
    import { useToast } from "@/components/ui/use-toast";

    export const ProModal = () => {
      const proModal = useProModal();
      const [isMounted, setIsMounted] = useState(false);
      const router = useRouter();

      useEffect(() => {
        setIsMounted(true);
      }, []);

      const onSubscribe = () => {
        router.push("/settings");
        proModal.onClose(); // Close the ProModal Dialog
      }

      if (!isMounted) {
        return null;
      }

      return (
        <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
          <DialogContent>
            <DialogHeader className="space-y-4">
              <DialogTitle className="text-center">
                Upgrade to Pro
              </DialogTitle>
              <DialogDescription className="text-center space-y-2">
                <span className="text-sky-500 mx-1 font-medium">AI</span>
                companions<br/>
                * 100 000 tokens / month<br/>
                * Better image resolution<br/>
                <br/>

              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="flex justify-between">
              <p className="text-2xl font-medium">
                $9<span className="text-sm font-normal">.99 / month</span>
              </p>
            </div> 

              <Button onClick={onSubscribe} variant="premium">
                Subscribe
              </Button>
              <span className="text-sm">Or you can buy token pack:</span>
                <Button onClick={onSubscribe} variant="premium">
                  Top up tokens
                </Button>
          </DialogContent>
        </Dialog>
      );
    };