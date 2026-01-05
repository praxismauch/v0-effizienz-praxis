from PIL import Image
import numpy as np

# Load the image
img = Image.open('public/app-icon.png')

# Convert to RGBA if not already
img = img.convert('RGBA')

# Get the image data
data = np.array(img)

# Define white color and tolerance for near-white pixels
white = [255, 255, 255, 255]
tolerance = 30  # Adjust this value if needed

# Create mask for white/near-white pixels
# Check if R, G, B channels are all above (255 - tolerance)
mask = (data[:, :, 0] > 255 - tolerance) & \
       (data[:, :, 1] > 255 - tolerance) & \
       (data[:, :, 2] > 255 - tolerance)

# Set alpha channel to 0 (transparent) for white pixels
data[mask, 3] = 0

# Create new image from modified data
result = Image.fromarray(data)

# Save the transparent version
result.save('public/app-icon.png', 'PNG')

print("✓ White background removed from public/app-icon.png")
print(f"  Tolerance used: {tolerance}")
print(f"  Transparent pixels: {np.sum(mask)}")
