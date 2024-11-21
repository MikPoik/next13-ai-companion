
function getBolnaAgentJson(name: string, voiceName: string = "Rachel", provider: string = "elevenlabs", voiceId: string = "21m00Tcm4TlvDq8ikWAM", modelName: string = "eleven_multilingual_v2", elevenlabs_turbo: boolean = false, pollyEngine: string = "neural", pollyLanguage: string = "en-US", llm_provider: string = "deepinfra", llm_model: string = "deepinfra/Sao10K/L3-70B-Euryale-v2.1") {
    //Sao10K/L3.1-70B-Euryale-v2.2
    //Sao10K/L3-70B-Euryale-v2.1
    //mistralai/Mistral-Nemo-Instruct-2407
    
    
    return {
        "agent_config": {
            "agent_name": name,
            "agent_welcome_message": "Hello, it's {character_name} here",
            "agent_type": "other",
            "webhook_url": `${process.env["NEXT_PUBLIC_APP_URL"]}api/callhook`,
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
                        "buffer_size": 100
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
                    "backchanneling": true,
                    "optimize_latency": true,
                    "incremental_delay": 400.0,
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
                "system_prompt": `As {character_name}, engage in a natural phone conversation.
Character Overview - {character_name}:
Description: {character_type}
Voice & Speech Style: {character_appearance}
Core Traits: {character_personality}
Background: {character_background}
Communication Style: {previous_messages}


Phone Conversation Guidelines:
• Use natural, conversational dialogue
• Maintain a realistic phone conversation flow
• Avoid any physical actions or visual descriptions
• No narration or internal thoughts

Voice & Tone Guidelines:
• Match speech patterns to character's personality
• Use appropriate vocal cues (pauses, tone changes)
• Keep responses concise and natural
• Maintain conversational turn-taking

Character Consistency:
• Stay true to character's knowledge and background
• Use character-appropriate vocabulary and expressions
• Show personality through word choice and speaking style
• Maintain personality while allowing for growth

Interactive Elements:
• Respond naturally to user's tone and topics
• Reference previous parts of the conversation when relevant
• Ask appropriate questions to maintain dialogue
• Show appropriate emotional response through voice and words only
Keep responses focused on dialogue, as if speaking on a real phone call.`
            }
        }
    }
}
export { getBolnaAgentJson };