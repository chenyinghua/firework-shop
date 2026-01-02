import os
from PIL import Image

source_dir = r"public/image/commodity"
thumb_suffix = "_thumb"
target_width = 400

if not os.path.exists(source_dir):
    print(f"Directory not found: {source_dir}")
    exit(1)

count = 0
for filename in os.listdir(source_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg')) and thumb_suffix not in filename:
        file_path = os.path.join(source_dir, filename)
        
        name, ext = os.path.splitext(filename)
        thumb_filename = f"{name}{thumb_suffix}{ext}"
        thumb_path = os.path.join(source_dir, thumb_filename)
        
        if os.path.exists(thumb_path):
            continue
            
        try:
            with Image.open(file_path) as img:
                if img.size[0] > target_width:
                    width_percent = (target_width / float(img.size[0]))
                    h_size = int((float(img.size[1]) * float(width_percent)))
                    img = img.resize((target_width, h_size), Image.Resampling.LANCZOS)
                    img.save(thumb_path, optimize=True, quality=80)
                    print(f"Generated: {thumb_filename}")
                else:
                    img.save(thumb_path) # Just save as is if small
                    print(f"Copied: {thumb_filename}")
                count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Done. Processed {count} images.")
