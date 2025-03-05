"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Sparkles,Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export const TopUpButton = ({
  isPro = false
}: {
  isPro: boolean;
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);
      const tokensAmount = "tokens-topup-200000";
      const response = await axios.get(`/api/stripe-topup?tokens=${encodeURIComponent(tokensAmount)}`);

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
        200 000 Pro tokens / 5.99$
      <Box className="w-4 h-4 ml-2" />
    </Button>
  )
};
