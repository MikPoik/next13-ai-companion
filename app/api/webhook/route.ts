import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import prismadb from "@/lib/prismadb"
import { stripe } from "@/lib/stripe"
import { UserButton } from "@clerk/nextjs"

import dotenv from "dotenv";
dotenv.config({ path: `.env` });

export const maxDuration = 60;

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get("Stripe-Signature") as string



    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }
    //console.log("[STRIPE EVENT]", event);
    const session = event.data.object as Stripe.Checkout.Session
    //console.log("[STRIPE SESSION]", session);

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        )

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }
        console.log("[STRIPE CREATE SUBSCRIPTION]");
        var user_sub = await prismadb.userSubscription.create({
            data: {
                userId: session?.metadata?.userId,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    subscription.current_period_end * 1000
                ),
            },
        })
        await prismadb.userBalance.upsert({
            where: {
                userId: user_sub.userId
            },
            update:
            {
                tokenCount: 0,
                messageCount: 0,
                messageLimit: 1000,
                tokenLimit: 100000

            },
            create: {
                userId: session?.metadata?.userId,
                tokenCount: 0,
                messageCount: 0,
                messageLimit: 1000,
                tokenLimit: 100000
            },
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        )

        var sub = await prismadb.userSubscription.update({
            where: {
                stripeSubscriptionId: subscription.id,
            },
            data: {
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(
                    subscription.current_period_end * 1000
                ),
            },
        })

        await prismadb.userBalance.upsert({
            where: {
                userId: sub.userId
            },
            update:
            {
                tokenCount: 0,
                messageCount: 0,
                messageLimit: 7500,
                tokenLimit: 100000

            },
            create: {
                userId: sub.userId,
                tokenCount: 0,
                messageCount: 0,
                messageLimit: 7500,
                tokenLimit: 100000
            },
        });
    }
    // Added condition for Stripe event: customer.subscription.updated
    if (event.type === "customer.subscription.updated") {
        console.log("subscription update event");
        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            )

        } else {
            console.log('session.subscription is undefined, retrieve event.')
            //console.log(event.data.object.id)

            if ((event.data.object as any).cancel_at_period_end && (event.data.object as any).canceled_at) {
                let canceled = (event.data.object as any).cancel_at_period_end;
                let cancel_timestamp = (event.data.object as any).canceled_at;
                let sub_id = (event.data.object as any).id;
                // use the value of reason
                console.log("[STRIPE SUB CANCELED]", canceled, cancel_timestamp);
                // delete subscription from db
                await prismadb.userSubscription.delete({
                    where: {
                        stripeSubscriptionId: sub_id,
                    },
                });
            }
            else {
                console.log("[STRIPE UNHANDLED SUB EVENT]");
            }

        }
        return new NextResponse(null, { status: 200 })
    };
}