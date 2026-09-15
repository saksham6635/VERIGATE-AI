/*
    Camera Manager Component
    Handles WebRTC video streams and snapshot extraction.
 */
export class CameraManager {
    static currentStream = null;

    /**
     * Requests camera permissions and binds the stream to a video element.
     * @param {HTMLVideoElement} videoElement 
     */
    static async start(videoElement) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("WebRTC is not supported in this browser.");
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            
            videoElement.srcObject = stream;
            this.currentStream = stream;
            
            // Return a promise that resolves when the video is actually playing
            return new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve(true);
                };
            });
        } catch (error) {
            console.error("[CameraManager] Error accessing webcam:", error);
            throw new Error("Camera permission denied or hardware unavailable.");
        }
    }

    /**
     * Stops the active video stream and releases the hardware camera.
     * @param {HTMLVideoElement} videoElement 
     */
    static stop(videoElement) {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        if (videoElement) {
            videoElement.srcObject = null;
        }
    }

    /**
     * Captures the current frame from the video element to a canvas.
     * @param {HTMLVideoElement} videoElement 
     * @param {HTMLCanvasElement} canvasElement 
     * @returns {string} Base64 data URL of the snapshot.
     */
    static takeSnapshot(videoElement, canvasElement) {
        if (!videoElement.videoWidth) return null;
        
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        
        const ctx = canvasElement.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        
        return canvasElement.toDataURL('image/jpeg', 0.90);
    }
}