/*
    Global Configuration Store
    Centralizes API keys, thresholds, and endpoints for the serverless architecture.
 */
export const CONFIG = {
    // API Keys
    getGroqKey: () => localStorage.getItem('VERIGATE_GROQ_API_KEY') || '',
    setGroqKey: (key) => localStorage.setItem('VERIGATE_GROQ_API_KEY', key),
    
    // External API Endpoints
    ENDPOINTS: {
        GROQ_VISION: 'https://api.groq.com/openai/v1/chat/completions',
        PYTHON_FORENSICS: 'https://your-api-url.hf.space/analyze' 
    },

    // AI Models
    MODELS: {
        GROQ_VISION_MODEL: 'qwen/qwen3.8-27b',
        TEACHABLE_STAMP_MODEL: './public/models/' // Path to your exported TF.js files
    },

    // Risk Engine Thresholds
    THRESHOLDS: {
        FACE_MATCH_DISTANCE: 0.51, // Lower = stricter matching (0.0 to 1.0)
        ELA_ANOMALY_SCORE: 35.0,   // Canvas ELA variance threshold
        EXPIRED_DOC_PENALTY: 20,   // Risk points added for expired documents
        MRZ_FAIL_PENALTY: 58       // Risk points added for checksum failure
    }
};