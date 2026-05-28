"use server";

import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { v2 as cloudinary } from 'cloudinary';
import { db } from '../db';
import { schemaDocImages } from '../db/schema';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function generateHtmlTemplate(contentHtml: string) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            color: #1a1a1a;
            width: 1120px;
            line-height: 1.6;
        }
        h1, h2, h3, h4 { color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }
        h1 { font-size: 2.25rem; }
        h2 { font-size: 1.5rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.875em; }
        pre { background-color: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto; }
        pre code { background-color: transparent; color: inherit; padding: 0; }
        blockquote { border-left: 4px solid #d1d5db; margin: 0; padding-left: 16px; color: #4b5563; }
        .documentation-container { max-width: 100%; }
    </style>
</head>
<body>
    <div class="documentation-container">
        ${contentHtml}
    </div>
</body>
</html>
`;
}

export async function generateDocumentationImages(connectionId: string, entityName: string, markdown: string) {
  console.log(`[Cloudinary] Starting image generation for ${entityName}...`);

  const contentHtml = await marked.parse(markdown);
  const fullHtml = generateHtmlTemplate(contentHtml);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 1000;
    const totalPages = Math.max(1, Math.ceil(bodyHeight / viewportHeight));

    const generatedImages: { pageNumber: number, imagePath: string }[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      
      const clip = {
        x: 0,
        y: i * viewportHeight,
        width: 1200,
        height: Math.min(viewportHeight, bodyHeight - (i * viewportHeight))
      };

      if (clip.height <= 0) clip.height = viewportHeight;

      // Capture screenshot as a Buffer
      const buffer = await page.screenshot({ clip, encoding: 'binary' }) as Buffer;

      // Upload to Cloudinary directly from Buffer
      const uploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `schema_refs/${connectionId}`,
            public_id: `${entityName}_page_${pageNumber}`,
            overwrite: true,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      }) as any;

      console.log(`[Cloudinary] Uploaded: ${uploadResponse.secure_url}`);

      generatedImages.push({ 
        pageNumber, 
        imagePath: uploadResponse.secure_url // Save the Cloudinary URL instead of local path
      });
    }

    return { success: true, images: generatedImages };

  } catch (e: any) {
    console.error(`[Cloudinary] Failed to generate/upload images for ${entityName}:`, e);
    return { success: false, error: e.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function saveImageMetadata(connectionId: string, entityName: string, images: { pageNumber: number, imagePath: string }[]) {
  if (!images || images.length === 0) return { success: true };

  try {
    const values = images.map(img => ({
      connectionId,
      entityName,
      pageNumber: img.pageNumber,
      imagePath: img.imagePath // This will now be the https://res.cloudinary.com/... URL
    }));

    await db.insert(schemaDocImages).values(values);
    console.log(`[Database] Saved Cloudinary metadata for ${entityName}.`);
    return { success: true };
  } catch (e: any) {
    console.error(`[Database] Failed to save metadata for ${entityName}:`, e);
    return { success: false, error: e.message };
  }
}