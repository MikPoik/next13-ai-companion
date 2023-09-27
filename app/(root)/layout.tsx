import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { checkSubscription } from "@/lib/subscription";
const RootLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  const isPro = await checkSubscription();

  return ( 
    <div className="h-screen flex flex-col">
      <Navbar isPro={isPro} />
      <div className="hidden md:flex mt-16 h-full w-20 flex-col fixed inset-y-0">
        <Sidebar isPro={isPro} />
      </div>
      <main className="md:pl-20 pt-16 flex-grow">
        {children}
      </main>
      <footer className="text-muted-foreground text-xs text-center w-full">
            {/* Your footer content goes here */}
            <p>&copy; {new Date().getFullYear()} trulov.me |{' '}
              <a href="/terms-of-service" className="text-grey-500 hover:none">Terms of Service</a> |{' '}
              <a href="https://discord.gg/DFYe5TrpXg" className="text-grey-500 hover:none" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', verticalAlign: 'middle',alignItems: 'center' }}>Discord Support</a>
            </p>
        </footer>        
    </div>
   );
}
 
export default RootLayout;