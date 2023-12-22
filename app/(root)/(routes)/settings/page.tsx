import { SubscriptionButton } from "@/components/subscription-button";
import { checkSubscription } from "@/lib/subscription";
import prismadb from "@/lib/prismadb";
import { auth, currentUser,redirectToSignIn } from "@clerk/nextjs";

const SettingsPage = async () => {
  const isPro = await checkSubscription();
  const user = await currentUser();
    
  if (!user) {
    return redirectToSignIn();
  }
  var tokens = 0;
  var token_limit = 10000;
  if (user) {
    const balance =  await prismadb.userBalance.findUnique({
      where: {
        userId: user.id
      }
    });
    if (balance) {
      tokens = balance.tokenCount;
      token_limit = balance.tokenLimit;
    }
  }
  return ( 
    <div className="h-full p-4 space-y-2">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="text-muted-foreground text-sm">
        {isPro ? "You are currently on a Pro plan." : "You are currently on a free plan."}
      </div>
      <SubscriptionButton isPro={isPro} />
        {!isPro && (
        <div className="text-muted-foreground text-sm"><br></br>
        <span className="text-sky-500 mx-1 font-medium">Pro</span>
        features:<br/>
        * 100 000 tokens / month<br/>
        * More NSFW llms<br/>
        * Voice messages <br/>
        * Better image resolution<br/>
        * More image generator models<br/>
        <br/>
        </div>)}
    <br/>
    <br/>
    <h3 className="text-lg font-medium">Usage</h3>
    <div className="text-muted-foreground text-sm">
    You are have used {tokens} tokens out of {token_limit}. 
    </div>
    </div>
   );
}
 
export default SettingsPage;
