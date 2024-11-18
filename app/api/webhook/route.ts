import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { currentUser} from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb"
import { stripe } from "@/lib/stripe"
import { UserButton } from "@clerk/nextjs"

import dotenv from "dotenv";
dotenv.config({ path: `.env` });

export const maxDuration = 60;

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers(); // await the headers
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event
    let tier = 'pro'

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        console.log("Webhook error:", error.message)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }
    console.log("[STRIPE EVENT]");

    

    const session = event.data.object as Stripe.Checkout.Session
    console.log("[STRIPE SESSION]");

    if (event.type === "checkout.session.completed") {
        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            )

            if (!session?.metadata?.userId) {
                console.log("No userId found in metadata checkoutsession")
                return new NextResponse("User id is required", { status: 400 });
            }
            if (session.metadata.tier) {
                tier = session.metadata.tier as 'pro' | 'unlimited';
                //console.log(`[STRIPE SUBSCRIPTION] Tier: ${tier}`);
            }
            
            
            // Check if this is an upgrade
            const isUpgrade = session?.metadata?.upgrade === 'true';
            if (isUpgrade) {
              console.log("Processing subscription upgrade");

              try {
                // Find existing subscription in the database
                const existingSubscription = await prismadb.userSubscription.findUnique({
                  where: { userId: session?.metadata?.userId },
                });
                if (existingSubscription && existingSubscription.stripeSubscriptionId) {
                  // Cancel the existing subscription in Stripe
                  await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
                  console.log(`Cancelled existing subscription: ${existingSubscription.stripeSubscriptionId}`);
                }
                // Update the subscription in the database
                var user_sub = await prismadb.userSubscription.update({
                  where: { userId: session?.metadata?.userId },
                  data: {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    tier: tier,
                  },
                });
                console.log("Subscription upgraded successfully");
              } catch (error) {
                console.error("Error processing subscription upgrade:", error);
                throw error; // or handle the error appropriately
              }
            } else {
              // Handle new subscription or renewal
              var user_sub = await prismadb.userSubscription.upsert({
                where: { userId: session?.metadata?.userId },
                update: {
                  stripeSubscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer as string,
                  stripePriceId: subscription.items.data[0].price.id,
                  stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  tier: tier,
                },
                create: {
                  userId: session?.metadata?.userId,
                  stripeSubscriptionId: subscription.id,
                  stripeCustomerId: subscription.customer as string,
                  stripePriceId: subscription.items.data[0].price.id,
                  stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                  tier: tier,
                },
              });
            }
            console.log("[STRIPE CREATE SUBSCRIPTION END, UPDATE BALANCE]");

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
        else {
            // New logic for handling one-time token top-up payment
            const handleTopUp = async (userId: string, type: 'proTokens' | 'callTime', increment: number) => {
                await prismadb.userBalance.upsert({
                    where: {
                        userId: userId,
                    },
                    update: {
                        [type]: {
                            increment: increment
                        },
                    },
                    create: {
                        userId: userId,
                        tokenCount: 0,
                        messageCount: 0,
                        messageLimit: 1000,
                        [type]: increment,
                    },
                });
                console.log(`[STRIPE ${type.toUpperCase()} TOP-UP SUCCESSFUL]`);
            };
            // Check for one-time top-up based on SKU or calltime
            const userId = session.metadata?.userId;
            if (!userId) {
                console.log("No userId found in topup")
                return new NextResponse("Metadata with user id is required for top-up", { status: 400 });
            }
            if (session?.metadata?.tokens === 'tokens-topup-50000') {
                await handleTopUp(userId, 'proTokens', 50000);
            } else if (session?.metadata?.calltime) {
                switch (session.metadata.calltime) {
                    case 'calltime-topup-5':
                        await handleTopUp(userId, 'callTime', 5 * 60); // 5 minutes in seconds
                        break;
                    case 'calltime-topup-10':
                        await handleTopUp(userId, 'callTime', 10 * 60); // 10 minutes in seconds
                        break;
                    case 'calltime-topup-30':
                        await handleTopUp(userId, 'callTime', 30 * 60); // 10 minutes in seconds
                        break;
                    // Add additional cases for different call time top-ups if needed
                    default:
                        console.log("[STRIPE UNHANDLED CALLTIME TOP-UP]");
                }
            }
        }
    }
    if (event.type === "invoice.payment_succeeded") {
        // Retrieve the invoice object from Stripe event
        console.log("[STRIPE INVOICE PAYMENT]");
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[INVOICE]");
        // Check if the invoice has a subscription ID
        if (!invoice.subscription) {
            console.log("[STRIPE INVOICE PAYMENT, NO SUBSCRIPTION]");
            return new NextResponse("Subscription id is required", { status: 400 });
        }

        // Retrieve the subscription details from Stripe using the subscription ID.
        const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
        );
        console.log("[SUBSCRIPTION]");

        const existingSub = await prismadb.userSubscription.findUnique({
            where: {
                stripeSubscriptionId: subscription.id,
            },
        });
        
        if (existingSub) {
            //console.log(existingSub)
            const sub = await prismadb.userSubscription.update({
                where: {
                    stripeSubscriptionId: subscription.id,
                },
                data: {
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeCurrentPeriodEnd: new Date(
                        subscription.current_period_end * 1000
                    ),
                },
            });
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
        } else {
            // Handle the case where the subscription doesn't exist
            // One option could be to create a new subscription record
            console.log("[NO EXISTING SUB TO UPDATE]");
        }

    }
    // Added condition for Stripe event: customer.subscription.updated
    if (event.type === "customer.subscription.updated") {
        console.log("subscription update event");
        if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            )
            //console.log(subscription)

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
                //await prismadb.userSubscription.delete({
                //    where: {
                //        stripeSubscriptionId: sub_id,
                //    },
                //});
            }
            else {
                console.log("[STRIPE UNHANDLED SUB EVENT]");
                const subscriptionUpdateData = event.data.object as Stripe.Subscription;
                //console.log(subscriptionUpdateData)
                if (subscriptionUpdateData.status === 'active') {
                    // Your logic here to renew the subscription in your database
                    // For example, update the `stripeCurrentPeriodEnd` field and other relevant fields
                      try {
                        // Find the existing subscription in the database
                        const existingSubscription = await prismadb.userSubscription.findUnique({
                          where: { stripeSubscriptionId: subscriptionUpdateData.id },
                        });
                        if (existingSubscription) {
                            console.log("Existing sub upgrade")
                            const updatedSub = await prismadb.userSubscription.update({
                                where: {
                                    stripeSubscriptionId: subscriptionUpdateData.id,
                                },
                                data: {
                                    stripeCurrentPeriodEnd: new Date(subscriptionUpdateData.current_period_end * 1000),
                                    //tier: tier
                                    // ... other fields you need to include during update
                                    // ... other fields you need to update
                                },
                            });
                            console.log("[STRIPE SUB RENEWED]");
                        }
                        } catch (error) {
                          console.error("Error processing subscription update:", error);
                          return new NextResponse("Error processing subscription update", { status: 500 });
                        }

                    // Perform any additional logic you might need after renewing the subscription
                    // For example: logging, notifying the user, etc.
                } else {
                    // Handle other subscription update scenarios
                }
            }

        }

    };
    return new NextResponse(null, { status: 200 })
}