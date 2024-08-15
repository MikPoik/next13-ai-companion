import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
const DAY_IN_MS = 86_400_000;
export const checkSubscription = async (): Promise<boolean> => {
  const { userId } = auth();
  if (!userId) {
    return false;
  }

  const userSubscription = await prismadb.userSubscription.findUnique({
    where: {
      userId: userId,
    },
    select: {
      stripeCurrentPeriodEnd: true,
      stripePriceId: true,
    },
  });

  const userBalance = await prismadb.userBalance.findUnique({
    where: {
      userId: userId,
    }
  });
  if (!userBalance) {
    return false;
  }


  const hasProTokenBalance = (userBalance?.proTokens ?? 0) > 0;
  // Adjusted check for valid subscription
    const hasValidSubscription = userSubscription?.stripeCurrentPeriodEnd 
       ? (userSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS) > Date.now() 
       : false;

  // Return true if has pro tokens, irrespective of valid subscription
    return hasProTokenBalance || hasValidSubscription;
};