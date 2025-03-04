import { SubscriptionButton } from "@/components/subscription-button";
import { TopUpButton } from "@/components/topup-button";
import { CallTopUpButton } from "@/components/call-topup-button";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/lib/prismadb";
import { auth } from '@clerk/nextjs/server'
import { Separator } from "@/components/ui/separator";

const SettingsPage = async () => {
    const { isSubscribed, tier } = await checkSubscription();
  const { userId, redirectToSignIn } = await auth()

   if (!userId) return redirectToSignIn()
    var tokens = 0;
    var token_limit = 1000000;
    var proTokens = 0;
    var callTime = 0;
    if (userId) {
        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: userId
            }
        });
        if (balance) {
            tokens = balance.tokenCount;
            token_limit = balance.tokenLimit;
            proTokens = balance.proTokens;
            callTime = balance.callTime;
        } else {
            //balance record does not exist, create one
            const currentDateTime = new Date().toISOString();
            await prismadb.userBalance.create({
                data: {
                    userId: userId,
                    tokenCount: 0,
                    messageCount: 1,
                    messageLimit: 10000000,
                    tokenLimit: 100000,
                    firstMessage: currentDateTime,
                    proTokens: 0,
                    callTime: 0,
                    lastMessage: currentDateTime
                }
            });
        }
    }
    // Convert callTime to minutes and seconds
    const callTimeMinutes = Math.floor(callTime / 60);
    const callTimeSeconds = callTime % 60;

    let subEndDate = "";

    let subcriptionButtonState = false;
    if (isSubscribed) {
        //a bit duplicate check to manage sub button state
          const DAY_IN_MS = 86_400_000;
          const userSubscription = await prismadb.userSubscription.findUnique({
            where: {
              userId: userId
            },
            select: {
              stripeCurrentPeriodEnd: true,
              stripePriceId: true,
            },
          });
          if (userSubscription && userSubscription.stripeCurrentPeriodEnd) {
              subEndDate = new Date(userSubscription.stripeCurrentPeriodEnd).toISOString().split('T')[0];
          }

        const hasValidSubscription = userSubscription?.stripeCurrentPeriodEnd 
           ? (userSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS) > Date.now() 
           : false;
        if (hasValidSubscription) {
            subcriptionButtonState = true;
        }
    }
    return (
        <div className="h-full p-4 space-y-2">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="text-muted-foreground text-sm pb-4">
                {isSubscribed 
                    ? tier === 'unlimited'
                        ? `You are currently on an UNLIMITED plan.`
                        : subcriptionButtonState
                            ? `You are currently on a PRO plan.`
                            : `You are currently on a PRO plan from Pro Tokens.`
                    : "You are currently on a free plan."}
            </div>

            {!isSubscribed && (
                <div>
                    <div className="py-2">
                        <span className="text-sky-500 mx-1 font-medium" >Pro plan</span> - <span className="text-sky-500 mx-1 font-medium">4.99$</span> / month.
                        
                        <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                            * 1000,000 tokens / month<br />
                        </div>
                        <SubscriptionButton isPro={false} tier="pro" />
                    </div>

                    <div className="mt-4 py-2">
                       
                        <span className="text-purple-500 mx-1 font-medium">Unlimited plan</span> - <span className="text-purple-500 mx-1 font-medium">9.99$</span> / month.
                        <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                            * Unlimited tokens for chat and images<br />
                        </div>
                        <SubscriptionButton isPro={false} tier="unlimited" />
                    </div>
                </div>
            )}

            {subcriptionButtonState && (
                <div className="pb-3" >
                    <SubscriptionButton isPro={true} tier={tier} />
                </div>
            )}
            {subcriptionButtonState && tier == 'pro' && (
                <div className="mt-4 py-2">
                    <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                        Want to upgrade to Unlimited?<br />
                        
                    </div>   
                    <span className="text-purple-500 mx-1 font-medium">Unlimited plan</span> - <span className="text-purple-500 mx-1 font-medium">9.99$</span> / month.
                    <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                        * Unlimited tokens for chat and images<br /> 
                        
                    </div>           
                    <SubscriptionButton isPro={true} tier="unlimited" isUpgrade={true} />
            </div>

            )}
            {(proTokens > 0 && (isSubscribed && tier === 'pro')) && (
                <div className="mt-4 py-2">
                    <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                        Want to upgrade to Unlimited?
                    </div>   
                    <span className="text-purple-500 mx-1 font-medium">Unlimited plan</span> - <span className="text-purple-500 mx-1 font-medium">9.99$</span> / month.
                    <div className="text-muted-foreground text-sm py-2 pb-2 pl-1">
                        * Unlimited tokens for chat and images<br /> 
                    </div>           
                    <SubscriptionButton isPro={true} tier="unlimited" isUpgrade={true} />
                </div>
            )}
            <span className="mr-2"></span>
            <br />
             {!subcriptionButtonState && (
            <div>
            <div className="text-muted-foreground text-sm pb-1">
                Top up your account with <span className="text-sky-500 mx-1 font-medium">Pro</span>token pack:
            </div>
            <TopUpButton isPro={isSubscribed} /><span className="ml-5"> </span>
            </div>    
            )}
            <br />

            <div className="text-muted-foreground text-sm">
                <br />
                Buy call time for companion:
            </div>

            <CallTopUpButton amount={30} price="4.99$" isPro={isSubscribed} /><span className="mr-2"></span>
            <CallTopUpButton amount={60} price="8.99$" isPro={isSubscribed} /><span className="mr-2"></span>
            <br />
            <br />
            <h3 className="text-lg font-medium">Usage</h3>
            <div className="text text-sm">
                {tier === 'unlimited' 
                    ? 'You have unlimited usage.'
                    : `You have used ${tokens} tokens out of ${token_limit}.`
                }
                
                {tier !== 'unlimited' && (<><br/>You have {proTokens} <span className="text-sky-500 mx-1 font-medium">Pro</span> tokens.<br /></>)}
                <br/>You have {callTimeMinutes} minutes and {callTimeSeconds} seconds of call time
            </div>
        </div>
    );
}

export default SettingsPage;
