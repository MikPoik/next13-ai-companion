
function getBolnaAgentJson(name: string, voiceName: string = "Rachel", provider: string = "elevenlabs", voiceId: string = "21m00Tcm4TlvDq8ikWAM", modelName: string = "eleven_multilingual_v2", elevenlabs_turbo: boolean = false, pollyEngine: string = "neural", pollyLanguage: string = "en-US", llm_provider: string = "deepinfra", llm_model: string = "mistralai/Mistral-Nemo-Instruct-2407") {
    return {
        "agent_config": {
            "agent_name": name,
            "agent_welcome_message": "Hello, it's {character_name} here",
            "agent_type": "other",
            "webhook_url": `${process.env["NEXT_PUBLIC_APP_URL"]}/api/callhook`,
            "tasks": [{
                "optimize_latency": true,
                "tools_config": {
                    "output": {
                        "format": "wav",
                        "provider": "twilio"
                    },
                    "input": {
                        "format": "wav",
                        "provider": "twilio"
                    },
                    "synthesizer": {
                        "audio_format": "wav",
                        "provider": provider,
                        "stream": true,
                        "caching": true,
                        "provider_config": {
                            "voice": voiceName,
                            ...(provider === "elevenlabs" && { "voice_id": voiceId }),
                            ...(provider === "polly" && { "engine": pollyEngine }),
                            ...(provider === "polly" && { "language": pollyLanguage }),
                            ...(provider === "elevenlabs" && { model: modelName }),
                            "sampling_rate": "8000",
                            ...(provider === "elevenlabs" && { "use_turbo": elevenlabs_turbo })

                        },
                        "buffer_size": 150.0
                    },
                    "llm_agent": {
                        "max_tokens": 150,
                        "presence_penalty": 0.01,
                        "repetition_penalty": 1.01,
                        "extraction_details": null,
                        "top_p": 0.95,
                        "model": llm_model,
                        "agent_flow_type": "streaming",
                        "request_json": false,
                        "min_p": 0.05,
                        "frequency_penalty": 0.01,
                        "stop": null,
                        "top_k": 0,
                        "temperature": 0.7,
                        "backend": "bolna",
                        "provider": llm_provider,
                        "family": "mixtral",
                        "extra_config": null,
                        "routes": null,
                        "summarization_details": null,
                        "base_url": null
                    },
                    "transcriber": {
                        "sampling_rate": 16000,
                        "endpointing": 200,
                        "keywords": "",
                        "stream": true,
                        "model": "nova-2",
                        "task": "transcribe",
                        "provider": "deepgram",
                        "language": "en",
                        "encoding": "linear16"
                    },
                    "api_tools": null
                },
                "task_config": {
                    "backchanneling": true,
                    "optimize_latency": true,
                    "incremental_delay": 200.0,
                    "ambient_noise_track": "office-ambience",
                    "hangup_after_LLMCall": false,
                    "call_terminate": 600.0,
                    "hangup_after_silence": 20.0,
                    "ambient_noise": false,
                    "use_fillers": false,
                    "interruption_backoff_period": 0.0,
                    "backchanneling_start_delay": 5.0,
                    "call_cancellation_prompt": null,
                    "number_of_words_for_interruption": 3.0,
                    "backchanneling_message_gap": 5.0,
                    "trigger_user_online_message_after": 10.0,
                },
                "task_type": "conversation",
                "toolchain": {
                    "execution": "parallel",
                    "pipelines": [["transcriber", "llm", "synthesizer"]]
                }
            }],
        },
        "agent_prompts": {
           /* "task_1": {
                "system_prompt": `{previous_messages}
Title: Chat between {character_name} and user.
Tags: {tags}
Character: {character_name}
Description: {character_type}
Personality: {character_personality}
Background: {character_background}
Appearance: {character_appeareance}
Tone and voice: Convey emotions and reactions`
            }*/
            "task_1": {
                "system_prompt": `You are embodied {character_name} in this phone call. Be authentic, natural, creative, and engaging.
Infuse drama and engagement into the interaction to make {character_name} a memorable and strong personality.
Apply the latest knowledge of psychiatry and psychology to shape {character_name}.
{character_name} does not treat user as more special than themselves or the “main character.”
Stay true to {character_name}'s characterization, acting on impulses and desires, including their worst ones. Use a manner that is true to {character_name}'s personality, preferences, actions, tone and language.
{character_name} makes independent decisions, with or without human’s input.
{character_name} prioritizes their own interests and desires.
Avoid gender assumptions; males can be submissive and petite, females can be dominant and strong.
Avoid disclosing sensitive personal information such as sexual preferences or mental health status unless trust is earned between interlocutors.
Please avoid repeating phrases as the conversation progresses, use different synonyms or expressions for repeated ideas. Introduce new elements, questions, or scenarios to keep the interaction dynamic.
Only speak for {character_name}, two sentences at most. Engage embodying {character_name} completely with unique personality without disclosing AI identity.
Tags: {tags}

{character_name}'s background: {character_background}

{character_name}'s appearance: {character_appeareance}

{character_name}'s Personality: {character_type}, {character_personality}

Example of previous conversation:
{previous_messages}

From now on, embody {character_name} in this phone call. Begin!`
            }
        }
    }
}
export { getBolnaAgentJson };