"use client";

import { Home, Plus, Settings, HelpCircle, Component } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProModal } from "@/hooks/use-pro-modal";

interface SidebarProps {
    isPro: boolean;
}

export const Sidebar = ({
    isPro
}: SidebarProps) => {
    const proModal = useProModal();
    const router = useRouter();
    const pathname = usePathname();

    const onNavigate = (url: string, pro: boolean) => {
        if (pro && !isPro) {
            return proModal.onOpen();
        }

        if (url.startsWith("http")) {
            // If it's an external link, open in a new tab/window
            window.open(url, "_blank");
            return; // Add return to prevent further execution
        }
        const currentParams = new URLSearchParams(window.location.search);
        router.push(`${url}?${currentParams.toString()}`);
    }

    const routes = [
        {
            icon: Home,
            href: '/',
            label: "Home",
            pro: false,
        },
        {
        icon: MessagesSquare,
        href: '/my-chats',
        label: "My chats",
        pro: false,
        },
        {
            icon: Plus,
            href: '/companion/new',
            label: "Create",
            pro: false,
        },

        {
            icon: Settings,
            href: '/settings',
            label: "Subscription",
            pro: false,
        },
        {
            icon: "discord-mark-white.svg",
            href: 'https://discord.com/invite/CM6a23DZQD',
            label: "Discord",
            pro: false,
        },
    ];

    return (
        <div className="space-y-4 flex flex-col h-full text-primary bg-secondary">
            <div className="p-3 flex-1 flex justify-center">
                <div className="space-y-2">
                    {routes.map((route) => (
                        <div
                            onClick={() => onNavigate(route.href, route.pro)}
                            key={route.href}
                            className={cn(
                                "text-muted-foreground text-xs group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                                pathname === route.href && "bg-primary/10 text-primary",
                            )}
                        >
                            <div className="flex flex-col gap-y-2 items-center flex-1" title={route.label}>
                                {typeof route.icon === 'string' ? (
                                    <img src={`/${route.icon}`} className="h-5 w-5" alt={route.label} />
                                ) : (
                                    <route.icon className="h-5 w-5" />
                                )}
                                {/*route.label*/}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
