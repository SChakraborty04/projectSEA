/**
 * Phishing Detection Service
 * Uses Hugging Face Space FastAPI App running `cybersectony/phishing-email-detection-distilbert_v2.1`
 */

interface PhishingResult {
    isPhishing: boolean;
    confidence: number;
    label: 'Phishing' | 'Safe';
}

export async function classifyPhishing(subject: string, body: string): Promise<PhishingResult | null> {
    const apiUrl = process.env.PHISHING_DETECTION_API_URL;
    if (!apiUrl) {
        console.warn("[Phishing Detection] PHISHING_DETECTION_API_URL is not configured in .env. Skipping scan.");
        return null;
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY;

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (hfToken) {
            headers["Authorization"] = `Bearer ${hfToken}`;
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ subject, body }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("[Phishing Detection] API error:", errText);
            return null;
        }

        const data = await response.json();
        
        // Response format from FastAPI Space: { "status": "success", "label": "LABEL_1", "confidence": 0.99 }
        if (data && data.status === 'success' && data.label !== undefined) {
            const labelLower = data.label.toLowerCase();
            const isPhishing = labelLower.includes('phishing') || labelLower === 'label_1' || labelLower === 'label_3';
            
            return {
                isPhishing,
                confidence: data.confidence ?? 1.0,
                label: isPhishing ? 'Phishing' : 'Safe'
            };
        }

        return null;
    } catch (error) {
        console.error("[Phishing Detection] Request failed:", error);
        return null;
    }
}

