import { Steamship as SteamshipV2 } from 'steamship-client-v2';
import { SteamshipApiResponse } from "@/components/SteamShipBlock";

// Exporting the function
export async function generateAvatarSteamship(
    api_func: string,
    prompt: string,
    context_id: string,
    package_name: string,
    instance_handle: string,
    workspace_handle: string,
    personality: string,
    name: string,
    description: string,
    behaviour: string,
    selfie_pre: string,
    selfie_post: string,
    seed: string,
    model: string,
    image_model: string,
    create_images: boolean,
    voice_id: string
): Promise<string> {
    const maxRetryCount =
        3; // Maximum number of retry attempts
    const chat_id = context_id;
    for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
        try {
            const instance = await SteamshipV2.use(package_name, instance_handle, { llm_model: model, create_images: String(create_images) }, undefined, true, workspace_handle);

            const response = await (instance.invoke(api_func, {
                prompt,
                context_id,
                personality,
                name,
                description,
                behaviour,
                selfie_pre,
                selfie_post,
                seed,
                model,
                image_model,
                voice_id
            }) as Promise<SteamshipApiResponse>);
            const steamshipBlock = response.data;
            const steamshipBlockJSONString = JSON.stringify(steamshipBlock);
            //console.log(response);
            return steamshipBlockJSONString;
        } catch (error) {
            console.error('Received a error');
            if (retryCount < maxRetryCount - 1) {
                console.log('Retrying...');
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                throw new Error('Max retry attempts reached');
            }
        }
    }
    throw new Error('Max retry attempts reached');
}