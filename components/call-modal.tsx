"use client";
import { DialogInput } from "@/components/ui/dialog-input";
import { useEffect, useState } from "react";
import {  useRouter } from "next/navigation";
import { Sparkles,PhoneIncoming } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";


interface CallModalProps {
  isOpen: boolean; // Add this prop to match what's being passed in the ChatHeader
  onClose: () => void; // Add this prop to match what's being passed in the ChatHeader
  companionId: string; 
  companionName: string;
}

export const CallModal: React.FC<CallModalProps> = ({ isOpen, onClose,companionId,companionName }) => {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }
    useEffect(() => {
        setIsMounted(true); 
        if (isOpen) {
          setIsFetchingBalance(true); // Start fetching balance
          fetch('/api/send-call', { method: 'GET' })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === 'Not enough balance') {
                setShowTopUp(true);
              } else {
                setShowTopUp(false);
              }
              setIsFetchingBalance(false); // Finished fetching balance
            })
            .catch((error) => {
              setIsFetchingBalance(false); // Finished fetching balance even if there's an error
            });
        } else {
          setShowTopUp(false); // Reset the state when modal is closed
          setIsFetchingBalance(false); // Reset the fetching state when modal is closed
        }
      }, [isOpen, toast]);

  const topUp= () => {
    router.push("/settings");
  }
  const sendCall = () => {
      if (!inputValue) {
            toast({
              title: 'Input Error',
              description: "Please enter a phone number",
              duration: 5000,
              variant: "destructive",
            });
          return;
          
      }
      setIsCalling(true);
      // Set up the options for the POST request including headers and body
      const requestOptions = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ phoneNumber: inputValue, companionId: companionId }) // Sending the phone number in the request body
      };
      // Use the requestOptions in the fetch call
      fetch(`/api/send-call`, requestOptions)
          
      .then(response => response.json().then(data => ({ status: response.status, body: data.message })))
      .then(({ status, body }) => {
          setIsCalling(false);
        console.log(status, body);
        if (status === 200) {
          toast({
            title: 'Success',
            description: `${companionName} is calling you...`,
            duration: 5000,
            variant: "default",
          });
          onClose();
        } else if (status === 400 && body === "Not enough balance") {
          // Handle the specific error message for low balance
          toast({
            title: 'Balance Error',
            description: "You have insufficient balance for this call",
            duration: 5000,
            variant: "destructive",
          });
        } else if (status === 403 && body === "Subscription required") {
              // Handle the specific error message for low balance
              toast({
                title: 'Balance Error',
                description: "Pro only, upgrade your account for live calls",
                duration: 5000,
                variant: "destructive",
              });
        } else {
          toast({
            title: 'Request Error',
            description: body || "There was an issue requesting the call",
            duration: 5000,
            variant: "destructive",
          });
        }
      })
          .catch(error => {
              setIsCalling(false);
              console.error('Failed to request call:', error);
                toast({
                title: 'Network Error',
                description: "Failed to request call",
                duration: 5000,
                variant: "destructive",
              });
          });
  }

  if (!isMounted) {
    return null;
  }

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center">
              Talk to {companionName} on the phone
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <span className="text-sky-500 mx-1 font-medium">Live phone call</span>
          </DialogDescription>
              <DialogInput
                type="text"
                placeholder="Your phone number here +1234567..."
                value={inputValue}
                onChange={handleInputChange}
              />
            <span className="text-xs text-muted-foreground text-center">Conversation is added to chat history, refresh page after call</span>
        </DialogHeader>
        <Separator />
        <div className="flex justify-between">
          <p className="text-2xl font-medium">
          </p>
              {
                isFetchingBalance ? (
                  <p className="text-sm text-muted-foreground">Checking balance...</p>
                ) : (
                  showTopUp ? (
                    <Button onClick={topUp} variant="premium">
                      Top up balance <PhoneIncoming className="inline-block w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={sendCall} variant="premium" disabled={isCalling}>
                      Call me
                    </Button>
                  )
                )
              }
        </div>
      </DialogContent>
    </Dialog>
  );
};