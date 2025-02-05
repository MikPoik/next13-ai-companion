
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;
    console.log(audioFile.size)
    
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": audioFile.type,
      },
      body: audioFile,
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    return NextResponse.json({ text: data.results.channels[0].alternatives[0].transcript });

  } catch (error) {
    console.error("[TRANSCRIBE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
