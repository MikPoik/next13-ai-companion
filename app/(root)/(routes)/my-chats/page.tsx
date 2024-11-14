import { MyChats } from "./components/my-chats";
import { auth } from '@clerk/nextjs/server'
const MyChatsPage = async () => {
  const { userId, redirectToSignIn } = await auth()

   if (!userId) return redirectToSignIn()
  return (
    <div className="h-full p-4 space-y-2">
      <h2 className="text-2xl font-bold text-center">My chats</h2>
      <MyChats />
    </div>
  );
};

export default MyChatsPage;