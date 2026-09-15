from PIL import Image, ImageChops, ImageEnhance
import io, base64

def analyze_ela_browser(base64_data, quality=90):
    """
    Performs Error Level Analysis (ELA) natively inside the browser.
    Resaves the image at a known quality level and highlights the compression differences.
    """
    try:
        # Strip the data URI scheme if present (e.g., 'data:image/jpeg;base64,')
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 to image bytes
        img_bytes = base64.b64decode(base64_data)
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        
        # Re-compress the image into a memory buffer
        buffer = io.BytesIO()
        image.save(buffer, 'JPEG', quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer)
        
        # Subtract pixels to find altered areas
        ela_image = ImageChops.difference(image, recompressed)
        
        # Get the maximum difference to scale the brightness for human visibility
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        scale = 255.0 / (max_diff if max_diff != 0 else 1)
        
        # Enhance the image
        enhancer = ImageEnhance.Brightness(ela_image)
        enhanced_ela = enhancer.enhance(scale)
        
        return {"status": "success", "message": "Browser-native Python ELA completed.", "max_variance": max_diff}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}