/*
    Error Level Analysis (ELA) Engine using HTML5 Canvas.
*/
export class ELAEngine {
    
    /**
     * Generates an ELA heatmap and calculates an anomaly variance score.
     * @param {HTMLImageElement} sourceImage - The uploaded document image.
     * @param {number} quality - The resave compression quality (0.0 to 1.0).
     * @returns {Promise<Object>} - The generated ELA image data and variance score.
     */
    static async processELA(sourceImage, quality = 0.90) {
        return new Promise((resolve) => {
            const width = sourceImage.naturalWidth;
            const height = sourceImage.naturalHeight;

            // 1. Draw Original Image to Canvas
            const originalCanvas = document.createElement('canvas');
            originalCanvas.width = width;
            originalCanvas.height = height;
            const ctxOriginal = originalCanvas.getContext('2d', { willReadFrequently: true });
            ctxOriginal.drawImage(sourceImage, 0, 0);
            
            // 2. Extract Original Pixels
            const originalData = ctxOriginal.getImageData(0, 0, width, height);

            // 3. Compress Image (Simulate re-saving)
            const compressedDataUrl = originalCanvas.toDataURL('image/jpeg', quality);

            // 4. Load Compressed Image and Diff
            const compressedImg = new Image();
            compressedImg.onload = () => {
                const compressedCanvas = document.createElement('canvas');
                compressedCanvas.width = width;
                compressedCanvas.height = height;
                const ctxCompressed = compressedCanvas.getContext('2d', { willReadFrequently: true });
                ctxCompressed.drawImage(compressedImg, 0, 0);
                
                const compressedData = ctxCompressed.getImageData(0, 0, width, height);
                const diffData = ctxCompressed.createImageData(width, height);
                
                let maxDiff = 0;
                let totalDiff = 0;

                // 5. Pixel-by-Pixel Diff Calculation
                for (let i = 0; i < originalData.data.length; i += 4) {
                    const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
                    const gDiff = Math.abs(originalData.data[i+1] - compressedData.data[i+1]);
                    const bDiff = Math.abs(originalData.data[i+2] - compressedData.data[i+2]);
                    
                    const pixelMaxDiff = Math.max(rDiff, gDiff, bDiff);
                    if (pixelMaxDiff > maxDiff) maxDiff = pixelMaxDiff;
                    totalDiff += pixelMaxDiff;

                    // Store raw diff momentarily
                    diffData.data[i] = rDiff;
                    diffData.data[i+1] = gDiff;
                    diffData.data[i+2] = bDiff;
                    diffData.data[i+3] = 255; // Fully opaque alpha
                }

                // 6. Enhance/Amplify Differences for Visibility (Brightness Scale)
                const scale = 255.0 / (maxDiff === 0 ? 1 : maxDiff);
                for (let i = 0; i < diffData.data.length; i += 4) {
                    diffData.data[i] = Math.min(255, diffData.data[i] * scale * 2.5);   // R
                    diffData.data[i+1] = Math.min(255, diffData.data[i+1] * scale * 2.5); // G
                    diffData.data[i+2] = Math.min(255, diffData.data[i+2] * scale * 2.5); // B
                }

                // 7. Calculate Mean Variance (Heuristic Score)
                const pixelCount = width * height;
                const varianceScore = (totalDiff / pixelCount) * scale;

                resolve({
                    elaImageData: diffData,
                    varianceScore: varianceScore,
                    width: width,
                    height: height
                });
            };
            
            compressedImg.src = compressedDataUrl;
        });
    }
}