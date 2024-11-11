import { Avatar, AvatarImage } from "@/components/ui/avatar"

interface BotAvatarProps {
  src: string;
  height?: string;
  width?: string;
};

export const BotAvatar = ({
  src,
  height = "h-12",
  width = "w-8"
}: BotAvatarProps) => {
  return (
    <Avatar className={`${height} ${width}`}>
      <AvatarImage src={src} />
    </Avatar>
  );
};