import { CONFIG } from '../config.js';

/*
    Document OCR and parsing via Groq Vision API.
 */
export class GroqVisionService {
    
    /**
     * Extracts structured identity data from a base64 encoded image.
     * @param {string} base64Image
     * @returns {Promise<Object>} - Parsed JSON object containing document fields.
     */
    static async extractDocumentData(base64Image) {
        const apiKey = CONFIG.getGroqKey();
        
        if (!apiKey) {
            throw new Error('Groq API Key is missing. Please configure it in the navigation bar.');
        }

        const systemPrompt = `
            You are a highly accurate Identity Document Data Extraction Engine. 
            Analyze the provided image (Passport, Visa, ID, or Driving License).
            Extract the data exactly as written.
            
            Return ONLY a valid JSON object matching this exact schema:
            {
                "document_type": "Passport | Visa | National ID | Driving License | Unknown",
                "full_name": "Extracted Name",
                "document_number": "Extracted Number",
                "nationality": "Country Code or Name",
                "date_of_birth": "YYYY-MM-DD",
                "date_of_expiry": "YYYY-MM-DD",
                "gender": "M | F | X",
                "mrz_line_1": "Full MRZ Line 1 if present, else null",
                "mrz_line_2": "Full MRZ Line 2 if present, else null"
            }
            If a field is completely illegible or missing, output null for that value. Do not invent data.
        `;

        const requestBody = {
            model: CONFIG.MODELS.GROQ_VISION_MODEL,
            response_format: { type: "json_object" },
            temperature: 0.1, // Low temperature for factual extraction
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: systemPrompt },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ]
        };

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GROQ_VISION, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            const rawContent = data.choices[0].message.content;
            
            return JSON.parse(rawContent);

        } catch (error) {
            console.error('[GroqVisionService] Extraction Failed:', error);
            throw new Error(`Data extraction failed: ${error.message}`);
        }
    }
}