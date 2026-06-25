from PIL import Image

# Load the original image
img_path = "/Users/sumit/.gemini/antigravity/brain/5d9638d3-cc79-45ed-9ba6-70191f642fcc/media__1779287201090.png"
img = Image.open(img_path)
width, height = img.size

# We want the right side (from x = 46% to 100%)
# Crop dimensions: left, top, right, bottom
crop_box = (int(width * 0.45), 0, width, height)
cropped_img = img.crop(crop_box)

# Save the cropped image to public folder
cropped_img.save("/Users/sumit/Desktop/Smart menu system/tabletap/public/hero-visual-v4.png")
print("Cropped successfully to public/hero-visual-v4.png")
