import { redirect } from "next/navigation";
import { auth, redirectToSignIn } from "@clerk/nextjs/server";

import prismadb from "@/lib/prismadb";
import { checkSubscription } from "@/lib/subscription";

import { CompanionForm } from "./components/companion-form";

interface CompanionIdPageProps {
  params: {
    companionId: string;
  };
};

const CompanionIdPage = async ({
  params
}: CompanionIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return auth().redirectToSignIn();
  }

  //const validSubscription = await checkSubscription();

  //if (!validSubscription) {
  //  return redirect("/");
  //}

    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId,
        userId,
      },
      include: {
        tags: true, // Include the tags in the result
      }
    });


  const categories = await prismadb.category.findMany();
  const voices = await prismadb.voice.findMany();
  const phoneVoices = await prismadb.phoneVoice.findMany();
  const tags = await prismadb.tag.findMany();
  //return redirect("/");
  return (
    <CompanionForm initialData={companion} categories={categories} voices={voices} phoneVoices={phoneVoices} tags={tags} />
  );
}

export default CompanionIdPage;
