import { create } from 'zustand';
interface StreamState {
  content: string;
  setContent: (newContent: string) => void;
}
const useStreamStore = create<StreamState>((set) => ({
  content: "",
  setContent: (newContent) => set({ content: newContent }),
}));
export default useStreamStore;