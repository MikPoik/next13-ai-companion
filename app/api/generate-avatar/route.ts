import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    const url = `${process.env.MODAL_AGENT_BASE_URL}generate_avatar`;
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.MODAL_AUTH_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    return NextResponse.json(response.data);

  } catch (error) {
    console.error("[GENERATE_AVATAR_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}