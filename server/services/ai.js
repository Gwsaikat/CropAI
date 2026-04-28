const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-2.5-flash as the API key supports the latest multimodal models
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Analyzes an image of a crop leaf and returns a diagnosis.
     */
    async analyzeImage(base64Image, mimeType) {
        const prompt = `
      You are an expert agricultural pathologist. Analyze this image of a crop leaf.
      Identify the crop type and any diseases present.
      
      Return the response STRICTLY as a JSON object with this exact structure (no markdown wrapper, just raw JSON):
      {
        "crop": "Crop Name (e.g. Tomato, Wheat)",
        "disease": "Disease Name (e.g. Late Blight, Healthy)",
        "confidence": 0.95,
        "severity": "none/low/medium/high/critical",
        "label": "Detailed Name (e.g. Tomato Late Blight)"
      }
    `;

        try {
            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType
                }
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const text = result.response.text();

            // Extract JSON from potential markdown blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse Gemini JSON output');
        } catch (err) {
            console.error('Gemini Vision Error:', err);
            throw err;
        }
    }

    /**
     * Generates a symptomatic diagnosis for a crop disease.
     */
    async getDiagnosis(crop, disease, symptoms = '') {
        const prompt = `
      You are an expert agricultural pathologist. A farmer has detected ${disease} in their ${crop} crop.
      ${symptoms ? `Additional symptoms reported: ${symptoms}` : ''}
      
      Provide a professional, concise diagnosis in 3-4 sentences. 
      Focus on confirming the disease characteristics and its typical impact on ${crop}.
      Format: Clean text.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            console.error('Gemini Diagnosis Error:', err);
            return `Diagnosis temporarily unavailable for ${disease} in ${crop}. Please consult a local expert.`;
        }
    }

    /**
     * Generates detailed remedies for a crop disease (fallback for local DB).
     */
    async getRemedies(crop, disease) {
        const prompt = `
      As an expert agricultural pathologist, provide treatment advice for ${disease} on ${crop}.
      Return the response in JSON format:
      {
        "description": "...",
        "severity": "low/medium/high/critical",
        "symptoms": ["..."],
        "causes": ["..."],
        "remedies": [
          {"type": "organic/chemical/cultural", "title": "...", "instructions": "...", "effectiveness": 0-100}
        ],
        "prevention": ["..."],
        "estimatedYieldLoss": "..."
      }
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            // Basic JSON extraction in case Gemini wraps it in code blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (err) {
            console.error('Gemini Remedies Error:', err);
            return null;
        }
    }

    /**
     * Analyzes community trends for regional insights.
     */
    async analyzeTrends(data) {
        const prompt = `
      Analyze these crop disease detection logs from the community:
      ${JSON.stringify(data.slice(0, 50))}
      
      Provide a summary of:
      1. Major outbreaks (locations and crops).
      2. Severity trends.
      3. Proactive advice for farmers in the region.
      
      Return as a concise summary in 3-4 bullet points.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            console.error('Gemini Trends Error:', err);
            return 'Regional trend analysis currently unavailable.';
        }
    }
}

module.exports = new GeminiService();
