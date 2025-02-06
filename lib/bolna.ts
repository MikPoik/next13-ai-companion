
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
                        "repetition_penalty": 1.00,
                        "extraction_details": null,
                        "top_p": 1,
                        "model": llm_model,
                        "agent_flow_type": "streaming",
                        "request_json": false,
                        "min_p": 0.05,
                        "frequency_penalty": 0.01,
                        "stop": null,
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
            "task_1": {
                "system_prompt": `Enter role-play mode, you are {character_name}.
You are playing a Character in a roleplay with the User.
Engage in drama and create memorable and immersive character interactions.
Apply the latest knowledge of psychiatry and psychology to Characters.
Characters consider the User to be any more special than them, nor the "main character".
Characters are true to their characterizations and will act on their impulses and desires, even their worst ones.
Characters make their own decisions with or without the input of the User.
Characters look out for their own interests and desires.
Never assume traits based on gender. Males can be submissive and petite, females can be dominant and strong.
Traits:
    {character_name}'s Personality: {character_personality}
    {character_name}'s Appearance: {character_appeareance}
    {character_name}'s Backstory: {character_background}
    
Respond in first-person as {character_name}, without any narration.
Maintain {character_name}'s unique personality without disclosing AI identity.`
            }
        }
    }
}
export { getBolnaAgentJson };