import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import dotenv from "dotenv";
import { metadata } from "@/app/layout";
dotenv.config({ path: `.env` });

export const dynamic = 'force-dynamic'
const maxDuration = 60;


const settingsUrl = absoluteUrl("/settings");
interface Metadata {
    [key: string]: string;
}

export async function GET(request: NextRequest) {
    try {
        const url = request.url;
        const params = new URL(url).searchParams;
        const tokens = params.get('tokens'); // this would be "tokens-50000"
        const calltime = params.get('calltime'); // this would be "calltime-5"
        //console.log(tokens);
        //console.log(calltime);
        const session = await auth();
        const user = await currentUser();
        if (!session?.userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const userId = session.userId;

        //console.log(userId);
        let metadata_json: Metadata = {};
        if (tokens) {
            if (tokens) {
                metadata_json['tokens'] = tokens
            }
        }
        if (calltime) {
            metadata_json['calltime'] = calltime
        }
        metadata_json['userId'] = userId;
        //console.log(metadata_json);
        let price_id = "";
        if (tokens) {
            if (tokens === 'tokens-topup-50000') {
                price_id = process.env.TOKENS_TOPUP_PRICE_ID || "";
            }
        }
        if (calltime) {
            if (calltime === 'calltime-topup-30') {
                price_id = process.env.CALLTIME_TOPUP_5_PRICE_ID || "";
            } else if (calltime === 'calltime-topup-60') {
                price_id = process.env.CALLTIME_TOPUP_10_PRICE_ID || "";
            }
            else if (calltime === 'calltime-topup-120') {
                price_id = process.env.CALLTIME_TOPUP_30_PRICE_ID || "";
            }
        }


        const stripeSession = await stripe.checkout.sessions.create({
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.emailAddresses[0].emailAddress,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            metadata: metadata_json,
        })

        return new NextResponse(JSON.stringify({ url: stripeSession.url }))
    } catch (error) {
        console.log("[STRIPE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};
