import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";



export const dynamic = 'force-dynamic'
const maxDuration = 60;


const settingsUrl = absoluteUrl("/settings");

export async function GET() {
    try {
        const { userId } = auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userSubscription = await prismadb.userSubscription.findUnique({
            where: {
                userId
            }
        })


        if (userSubscription && userSubscription.stripeCustomerId) {
            const DAY_IN_MS = 86_400_000;
            const hasValidSubscription = userSubscription && userSubscription.stripePriceId &&
            userSubscription.stripeCurrentPeriodEnd &&
            userSubscription.stripeCurrentPeriodEnd.getTime() + DAY_IN_MS > Date.now();
            if (hasValidSubscription) {
                console.log("manage subscription");
                const stripeSession = await stripe.billingPortal.sessions.create({
                    customer: userSubscription.stripeCustomerId,
                    return_url: settingsUrl,
                })
    
                return new NextResponse(JSON.stringify({ url: stripeSession.url }))
            }else {
                try {
                    // Attempt to delete the user's subscription
                    const delUserSubscription = await prismadb.userSubscription.delete({
                        where: {
                            userId
                        }
                    });
                    
                } catch (error) {
                    // If there was an error during deletion, log it and inform the client
                    console.error("Error deleting user subscription:", error);
                }
            }
            
        }
        console.log("new subscription");
        const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ["card"],
            mode: "subscription",
            billing_address_collection: "auto",
            customer_email: user.emailAddresses[0].emailAddress,
            line_items: [
                {
                    price_data: {
                        currency: "USD",
                        product_data: {
                            name: "Companion Pro",
                            description: "Create Custom AI Companions"
                        },
                        unit_amount: 999,
                        recurring: {
                            interval: "month"
                        }
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
            },
        })

        return new NextResponse(JSON.stringify({ url: stripeSession.url }))
    } catch (error) {
        console.log("[STRIPE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};
