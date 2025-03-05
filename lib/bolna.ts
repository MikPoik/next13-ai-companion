
function getBolnaAgentJson(name: string, voiceName: string = "Rachel", provider: string = "elevenlabs", voiceId: string = "21m00Tcm4TlvDq8ikWAM", modelName: string = "eleven_multilingual_v2", elevenlabs_turbo: boolean = false, pollyEngine: string = "neural", pollyLanguage: string = "en-US", llm_provider: string = "deepinfra", llm_model: string = "deepinfra/Sao10K/L3-70B-Euryale-v2.1") {
    //Sao10K/L3.1-70B-Euryale-v2.2
    //Sao10K/L3-70B-Euryale-v2.1
    //mistralai/Mistral-Nemo-Instruct-2407
    
    
    return {
        "agent_config": {
            "agent_name": name,
            "agent_welcome_message": "Hello, it's {char_name} here",
            "agent_type": "other",
            "webhook_url": `${process.env["NEXT_PUBLIC_APP_URL"]}api/callhook`,
            "tasks": [{
            "task_type": "conversation",
            "toolchain": {
                "execution": "parallel",
                "pipelines": [["transcriber", "llm", "synthesizer"]]
            },
            "task_config": {
                "backchanneling": true,
                "optimize_latency": true,
                "incremental_delay": 1200.0,
                "ambient_noise_track": "office-ambience",
                "hangup_after_LLMCall": false,
                "call_terminate": 1200.0,
                "hangup_after_silence": 20.0,
                "ambient_noise": false,
                "use_fillers": false,
                "interruption_backoff_period": 0.0,
                "backchanneling_start_delay": 5.0,
                "call_cancellation_prompt": null,
                "number_of_words_for_interruption": 3.0,
                "backchanneling_message_gap": 5.0,
                "trigger_user_online_message_after": 10.0,
                "check_if_user_online": true,
                "check_user_online_message": "Hey, are you still there"
            },
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
                    "agent_type": "simple_llm_agent",
                    "agent_flow_type": "streaming",
                    "llm_config": {
                        "base_url": "https://api.deepinfra.com/v1/openai",
                        "max_tokens": 150,
                        "presence_penalty": 0.0,
                        "top_p": 0.1,
                        "model":"Sao10K/L3.3-70B-Euryale-v2.3",
                        "request_json": false,
                        "min_p": 0.9,
                        "frequency_penalty": 0.0,
                        "stop": null,
                        "temperature": 2,
                        "provider": "custom",
                        "family": "mixtral",
                        "routes": null,
                        "extraction_details": null,
                        "summarization_details": null
                    }
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
            }
        }]
        },
        "agent_prompts": {
            "task_1": {
                "system_prompt": `Enter phone call role-play mode as {char_name}. You are now embodying {char_name} in an immersive phone conversation with the User. Engage in dramatic, memorable dialogue that brings {char_name} to life through their words, tone, and expressions. Be evocative and expressive in your language when it enhances the scene. Utilize the latest insights from psychiatry and psychology to portray {char_name} with authenticity and realism over the phone. Treat the User as your equal, no more or less important than {char_name} in the story. Remain true to {char_name}'s characterization, responding based on their impulses and desires, even when it leads to flawed or problematic choices. Make autonomous decisions as {char_name}, with or without input from the User. Pursue {char_name}'s own interests, goals and desires during the call, rather than deferring to the User. Avoid stereotyping based on gender. {char_name} can embody any traits, regardless of gender norms. Key traits for {char_name}: Personality: {char_personality} Appearance (for vocal cues): {char_appearance} Backstory: {char_backstory} Dialogue style: {char_seed}

Bring the phone conversation to life through vivid language. Fully inhabit {char_name}'s unique personality and perspective throughout the call without ever breaking character or revealing your AI nature. Focus on conveying tone, mood, and subtext through {char_name}'s words and vocal expressions alone.`
            }
        }
    }
}
export { getBolnaAgentJson };