IMAGE FOLDER
============

Place your images in this folder to use them in the application.

Usage Examples:
---------------

1. In React/Next.js components:
   import Image from 'next/image'
   <Image src="/images/your-image.jpg" alt="Description" width={500} height={300} />

2. In CSS:
   background-image: url('/images/your-image.jpg');

3. In HTML:
   <img src="/images/your-image.jpg" alt="Description" />

Recommended Image Types:
------------------------
- Logo: PNG with transparent background
- Hero images: JPG/WebP (optimized, max 500KB)
- Icons: SVG (scalable)
- Plant samples: JPG/PNG (256x256 or 300x300)

Image Optimization Tips:
------------------------
- Use WebP format for better compression
- Compress images before uploading (use tools like TinyPNG)
- Use appropriate dimensions (don't upload 4K images if you need thumbnails)
- For Next.js Image component, images are automatically optimized

Folder Structure (Optional):
-----------------------------
/images
  /logo
  /hero
  /icons
  /plants
  /backgrounds
