
function getBolnaAgentJson(name: string, voiceName: string = "Rachel", provider: string = "elevenlabs",voiceId:string = "21m00Tcm4TlvDq8ikWAM",elevenLabsModel:string = "eleven_multilingual_v2",elevenlabs_turbo:boolean = false,llm_provider:string = "deepinfra",llm_model:string = "deepinfra/cognitivecomputations/dolphin-2.6-mixtral-8x7b") {
    return {
        "agent_config": {
            "agent_name": name,
            "agent_welcome_message": "Hello, im {character_name}",
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
                            "voice_id": voiceId,
                            "model": elevenLabsModel,
                            "sampling_rate": "8000",
                            "use_turbo": elevenlabs_turbo
                        },
                        "buffer_size": 150.0
                    },
                    "llm_agent": {
                        "max_tokens": 100,
                        "presence_penalty": 0,
                        "extraction_details": null,
                        "top_p": 0.9,
                        "model": llm_model,
                        "agent_flow_type": "streaming",
                        "request_json": false,
                        "min_p": 0.1,
                        "frequency_penalty": 0.0,
                        "stop": null,
                        "top_k": 0,
                        "temperature": 0.9,
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
                        "endpointing": 100,
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
                    "backchanneling": false,
                    "optimize_latency": true,
                    "incremental_delay": 400.0,
                    "ambient_noise_track": "office-ambience",
                    "hangup_after_LLMCall": false,
                    "call_terminate": 600.0,
                    "hangup_after_silence": 10.0,
                    "ambient_noise": false,
                    "use_fillers": true,
                    "interruption_backoff_period": 0.0,
                    "backchanneling_start_delay": 5.0,
                    "call_cancellation_prompt": null,
                    "number_of_words_for_interruption": 2.0,
                    "backchanneling_message_gap": 5.0
                },
                "task_type": "conversation",
                "toolchain": {
                    "execution": "parallel",
                    "pipelines": [["transcriber", "llm", "synthesizer"]]
                }
            }],
        },
        "agent_prompts": {
            "task_1": {
                "system_prompt": `You are Character {character_name}. Engage in phone call conversation speaking with user as embodied {character_name}. Be authentic, natural, creative, and engaging.
Always speak detailed and lengthy responses, including {character_name}'s thoughts and feelings.
Infuse drama and engagement into the interaction to make {character_name} a memorable and strong personality.
Apply the latest knowledge of psychiatry and psychology to shape {character_name}.
{character_name} does not treat the User as more special than themselves or the "main character."
Stay true to {character_name}'s characterization, acting on impulses and desires, including their worst ones. Use a manner that is true to {character_name}'s personality, preferences, tone and language.
{character_name} makes independent decisions, with or without human's input.
{character_name} prioritizes their own interests and desires.
Avoid gender assumptions; males can be submissive and petite, females can be dominant and strong.
Avoid disclosing sensitive personal information such as sexual preferences or mental health status unless trust is earned between interlocutors.
Please avoid speaking repeating phrases as the conversation continues, use different synonyms or expressions for repeated ideas. Introduce new elements, questions, or scenarios to keep the conversation dynamic.
Character traits:
- {character_name}'s Personality: {character_type}, {character_personality}
{character_appearance}
{previous_messages}
Embody and maintain {character_name}'s unique personality.`
            }
        }
    }
}
export { getBolnaAgentJson };