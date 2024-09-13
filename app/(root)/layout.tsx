import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { AgeVerification } from "@/components/age-verification"; // Corrected import statement
import { checkSubscription } from "@/lib/subscription";
import CookieConsent from '@/components/cookie-consent';

const RootLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { isSubscribed, tier } = await checkSubscription();
  return ( 
    <div className="h-screen flex flex-col">
        
      <Navbar isPro={isSubscribed} tier={tier} />
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0">
        <Sidebar isPro={isSubscribed} />
      </div>
      <main className="md:pl-20 pt-16 flex-grow">
           <AgeVerification />
        <CookieConsent />
        {children}
      </main>
      <footer className="text-muted-foreground text-xs text-center w-full">
            {/* Your footer content goes here */}
            <p>&copy; {new Date().getFullYear()} truluv.me |{' '}
              <a href="/terms-of-service" className="text-grey-500 hover:none">Terms of Service</a>              
            </p>
        </footer>        
    </div>
   );
}
 
export default RootLayout;