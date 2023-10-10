import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import prismadb from "@/lib/prismadb"
import { stripe } from "@/lib/stripe"
import { UserButton } from "@clerk/nextjs"

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

  const session = event.data.object as Stripe.Checkout.Session

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

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
          messageLimit:1000,
          tokenLimit:10000          

        },
        create: {
          userId: session?.metadata?.userId,
          tokenCount:0,
          messageCount: 0,
          messageLimit:1000,
          tokenLimit:10000
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
          messageLimit:7500,
          tokenLimit:10000          

        },
        create: {
          userId: sub.userId,
          tokenCount:0,
          messageCount: 0,
          messageLimit:7500,
          tokenLimit:10000
        },        
    });        
  }

  return new NextResponse(null, { status: 200 })
};
