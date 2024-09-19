import { MyChats } from "./components/my-chats";

const MyChatsPage = async () => {
  return (
    <div className="h-full p-4 space-y-2">
      <h2 className="text-2xl font-bold text-center">My Chats</h2>
      <MyChats />
    </div>
  );
};

export default MyChatsPage;