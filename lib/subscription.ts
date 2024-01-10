import { auth } from "@clerk/nextjs";
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
  if (!userSubscription || !userSubscription.stripePriceId) {
    return false;
  }
    const hasProTokenBalance = (userBalance?.proTokens ?? 0) > 0;
    const hasValidSubscription = userSubscription.stripeCurrentPeriodEnd &&
                                 (userSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS) > Date.now();
    return !!hasProTokenBalance || !!hasValidSubscription;
};