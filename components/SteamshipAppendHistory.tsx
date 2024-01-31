import { Steamship } from '@steamship/client';
import { SteamshipApiResponse } from "@/components/SteamShipBlock";

// Exporting the function
export async function appendHistorySteamship(
    api_func: string,
    prompt: string,
    context_id: string,
    package_name: string,
    instance_handle: string,
    workspace_handle: string,
    model: string,
    create_images: boolean,
): Promise<string> {
    const maxRetryCount =
        3; // Maximum number of retry attempts
    for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
        try {
            const instance = await Steamship.use(package_name, instance_handle, { llm_model: model, create_images: String(create_images) }, undefined, true, workspace_handle);
            const response = await (instance.invoke(api_func, {
                prompt: prompt,
                context_id: context_id,
            }) as Promise<SteamshipApiResponse>);
            const steamshipBlock = response.data;
            const steamshipBlockJSONString = JSON.stringify(steamshipBlock);
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