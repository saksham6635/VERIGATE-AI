import { CONFIG } from '../config.js';

/*
    WebGL-accelerated facial recognition and 1:1 matching.
 */
export class FaceMatchEngine {
    
    static isInitialized = false;

    /* face_api.js */
    static async initModels() {
        if (this.isInitialized) return;
        
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            this.isInitialized = true;
            console.log('[FaceMatchEngine] Models loaded successfully.');
        } catch (error) {
            console.error('[FaceMatchEngine] Failed to load models:', error);
            throw new Error('Biometric models failed to initialize. Please check network connection.');
        }
    }

    /**
     * Extracts a 128D descriptor (embedding) from an image or video element.
     * @param {HTMLImageElement | HTMLVideoElement} input 
     */
    static async getFaceDescriptor(input) {
        if (!this.isInitialized) await this.initModels();

        const detection = await faceapi.detectSingleFace(input)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error('No face detected in the provided input.');
        }

        return detection.descriptor;
    }

    /**
     * Compares two descriptors and returns the Euclidean distance.
     * @param {Float32Array} descriptor1 
     * @param {Float32Array} descriptor2 
     * @returns {Object} { distance, isMatch }
     */
    static compareFaces(descriptor1, descriptor2) {
        // Calculate Euclidean distance
        const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
        
        // Threshold check (0.55 default config)
        const threshold = CONFIG.THRESHOLDS.FACE_MATCH_DISTANCE || 0.55;
        const isMatch = distance < threshold;

        return { distance, isMatch, threshold };
    }
}