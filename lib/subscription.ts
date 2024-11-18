import { auth } from "@clerk/nextjs/server";
import prismadb from "./prismadb";

export const checkSubscription = async (): Promise<{
  isSubscribed: boolean;
  tier: 'free' | 'pro' | 'unlimited';
}> => {
  const session = await auth();

  if (!session?.userId) {
    return { isSubscribed: false, tier: 'free' };
  }

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: session.userId
    },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
      tier: true
    }
  });

  if (!userSubscription) {
    return { isSubscribed: false, tier: 'free' };
  }

  const DAY_IN_MS = 86_400_000;
  const isValid = userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  return {
    isSubscribed: !!userSubscription.stripeSubscriptionId && isValid,
    tier: userSubscription.tier as 'free' | 'pro' | 'unlimited'
  };
};