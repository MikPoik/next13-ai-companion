import { Avatar, AvatarImage } from "@/components/ui/avatar"

interface BotAvatarProps {
  src: string;
  height?: string;
  width?: string;
};

export const BotAvatar = ({
  src,
  height = "h-12",
  width = "w-12"
}: BotAvatarProps) => {
  return (
    <Avatar className={`${height} ${width} object-cover`}>
      <AvatarImage src={src} style={{ objectFit: 'cover' }} />
    </Avatar>
  );
};