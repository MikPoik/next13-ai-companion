"use client";
import axios from "axios";
import { useState } from "react";
import { PhoneIncoming } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
interface CallTopUpButtonProps {
  amount: number;         // The amount of the top-up (5, 10, 20, ...)
  price: string;          // The price to display ($4.99, $8.99, ...)
  isPro?: boolean;        // Optional prop to define if user is Pro
}
export const CallTopUpButton = ({
  amount,
  price,
  isPro = false
}: CallTopUpButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    try {
      setLoading(true);
      const tokensAmount = `calltime-topup-${amount}`;
      const response = await axios.get(`/api/stripe-topup?calltime=${encodeURIComponent(tokensAmount)}`);
      window.location.href = response.data.url;
    } catch (error) {
      toast({
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button size="sm" variant="premium" disabled={loading} onClick={onClick} >
      Call time - {price} / {amount} min
      <PhoneIncoming className="w-4 h-4 ml-2" />
    </Button>
  )
};