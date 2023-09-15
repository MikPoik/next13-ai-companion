import dotenv from "dotenv";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

dotenv.config({ path: `.env` });

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    const companion = await prismadb.companion.update({
      where: {
        id: params.chatId
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      }
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }
    //console.log(companion.apiUrl);
    const name = companion.id;

    const resp = await fetch(companion.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": ``
      },
      body: JSON.stringify({
        question: prompt,
        chat_id: user.id
      })
    });
    const response = await resp.text()
    const responseBlocks = JSON.parse(response)

    //console.log(response)

    if (responseBlocks.length > 0) {
      await prismadb.companion.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: response,
              role: "system",
              userId: user.id,
            },
          },
        }
      });
    }
    //console.log(responseBlocks)
    return NextResponse.json(responseBlocks)

  } catch (error) {
    console.log(error)
    return new NextResponse("Internal Error", { status: 500 });
  }
};
