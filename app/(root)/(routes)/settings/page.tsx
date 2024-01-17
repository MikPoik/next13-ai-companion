import { SubscriptionButton } from "@/components/subscription-button";
import { TopUpButton } from "@/components/topup-button";
import { CallTopUpButton } from "@/components/call-topup-button";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/lib/prismadb";
import { auth, currentUser, redirectToSignIn } from "@clerk/nextjs";

const SettingsPage = async () => {
    const isPro = await checkSubscription();
    const user = await currentUser();

    if (!user) {
        return redirectToSignIn();
    }
    var tokens = 0;
    var token_limit = 10000;
    var proTokens = 0;
    var callTime = 0;
    if (user) {
        const balance = await prismadb.userBalance.findUnique({
            where: {
                userId: user.id
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
                    userId: user.id,
                    tokenCount: 0,
                    messageCount: 1,
                    messageLimit: 1000,
                    tokenLimit: 10000,
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
    return (
        <div className="h-full p-4 space-y-2">
            <h3 className="text-lg font-medium">Settings</h3>
            <div className="text-muted-foreground text-sm">
                {isPro ? "You are currently on a Pro plan (Subscription or Pro tokens)." : "You are currently on a free plan."}
            </div>
            {!isPro && (
                <div>
                    <span className="text-sky-500 mx-1 font-medium">Pro</span> plan subscription   <span className="text-sky-500 mx-1 font-medium">9.99$</span> / month.
                    <div className="text-muted-foreground text-sm">
                        * 100 000 tokens / month<br />
                        * More NSFW llms<br />
                        * Voice messages <br />
                        * Better image resolution<br />
                        * More image generator models<br />
                    </div></div>)}
            <SubscriptionButton isPro={isPro} />
            <span className="mr-2"></span>
            <br /><br />
            <div className="text-muted-foreground text-sm">
                Top up your account with <span className="text-sky-500 mx-1 font-medium">Pro</span>token pack:
            </div>
            <TopUpButton isPro={isPro} /><span className="ml-5"> </span>
            <br />
            <div className="text-muted-foreground text-sm">
                <br />
                Buy call time for companion:
            </div>

            <CallTopUpButton amount={5} price="4.99$" isPro={isPro} /><span className="mr-2"></span>
            <CallTopUpButton amount={10} price="8.99$" isPro={isPro} /><span className="mr-2"></span><CallTopUpButton amount={30} price="24.99$" isPro={isPro} />
            <br />
            <br />
            <h3 className="text-lg font-medium">Usage</h3>
            <div className="text text-sm">
                You are have used {tokens} tokens out of {token_limit}. <br />
                You have {proTokens} <span className="text-sky-500 mx-1 font-medium">Pro</span> tokens.<br />
                You have {callTimeMinutes} minutes and {callTimeSeconds} seconds of call time
            </div>
        </div>
    );
}

export default SettingsPage;
