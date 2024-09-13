import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
const DAY_IN_MS = 86_400_000;
export const checkSubscription = async (): Promise<{
  isSubscribed: boolean;
  tier: 'free' | 'pro' | 'unlimited';
}> => {
  const { userId } = auth();
  if (!userId) {
    return { isSubscribed: false, tier: 'free' };
  }
  const userSubscription = await prismadb.userSubscription.findUnique({
    where: { userId: userId },
    select: {
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
      tier: true, // Assuming you've added this field to your schema
    },
  });
  const userBalance = await prismadb.userBalance.findUnique({
    where: { userId: userId }
  });
  if (!userBalance) {
    return { isSubscribed: false, tier: 'free' };
  }
  const hasProTokenBalance = (userBalance?.proTokens ?? 0) > 0;
  const hasValidSubscription = userSubscription?.stripeCurrentPeriodEnd 
    ? (userSubscription.stripeCurrentPeriodEnd.getTime()) > Date.now() 
    : false;
  if (userSubscription?.tier === 'unlimited' && hasValidSubscription) {
    return { isSubscribed: true, tier: 'unlimited' };
  } else if (hasProTokenBalance || (hasValidSubscription && userSubscription?.tier === 'pro')) {
    return { isSubscribed: true, tier: 'pro' };
  } else {
    return { isSubscribed: false, tier: 'free' };
  }
};