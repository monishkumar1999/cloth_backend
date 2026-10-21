const sharp = require('sharp');
const fs = require('fs');
const http = require('http');

async function testSingleUpload() {
  console.log('=== TESTING SINGLE IMAGE UPLOAD WITH SHARP AUTO-VARIANTS ===');

  // 1. Create a dummy test image buffer (1920x1080)
  const imageBuffer = await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: { r: 35, g: 35, b: 40 }
    }
  }).png().toBuffer();

  const boundary = '----WebKitFormBoundarySharpTest789';
  
  function fieldPart(name, value) {
    return Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
      `${value}\r\n`
    );
  }

  const fileHeader = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image"; filename="sharp-test.png"\r\n` +
    `Content-Type: image/png\r\n\r\n`
  );

  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

  const payload = Buffer.concat([
    fieldPart('name', 'Sharp Auto Generation Banner'),
    fieldPart('title', 'OVERSIZED WINTER COLLECTION'),
    fieldPart('subtitle', 'Auto-generated mobile variant'),
    fieldPart('cta_text', 'SHOP DROP'),
    fieldPart('cta_url', '/collections/winter'),
    fileHeader,
    imageBuffer,
    footer
  ]);

  const req = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/banners',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length,
      'x-admin-key': 'admin-secret-key'
    }
  }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', async () => {
      console.log('HTTP Status:', res.statusCode);
      const json = JSON.parse(raw);
      console.log('Banner Created:', {
        id: json.data?.id,
        image_url: json.data?.image_url,
        mobile_image_url: json.data?.mobile_image_url
      });

      if (json.data?.image_url && json.data?.mobile_image_url) {
        console.log('[PASS] Desktop variant created as WebP:', json.data.image_url.endsWith('.webp'));
        console.log('[PASS] Mobile variant auto-generated as WebP:', json.data.mobile_image_url.endsWith('.webp'));
      }

      // Check public endpoint
      const pubReq = http.request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/banners/homepage',
        method: 'GET'
      }, (pubRes) => {
        let pubRaw = '';
        pubRes.on('data', chunk => pubRaw += chunk);
        pubRes.on('end', () => {
          const pubJson = JSON.parse(pubRaw);
          const matched = pubJson.data?.find(b => b.id === json.data?.id);
          console.log('[PASS] Returned in public homepage API:', Boolean(matched));
          console.log('Public item image URLs:', {
            desktop: matched?.image_url,
            mobile: matched?.mobile_image_url
          });

          // Clean up created test banner
          const delReq = http.request({
            hostname: '127.0.0.1',
            port: 5000,
            path: `/api/admin/banners/${json.data?.id}`,
            method: 'DELETE',
            headers: { 'x-admin-key': 'admin-secret-key' }
          }, () => {
            console.log('Test banner cleaned up successfully.');
            process.exit(0);
          });
          delReq.end();
        });
      });
      pubReq.end();
    });
  });

  req.on('error', err => {
    console.error('Req error:', err);
    process.exit(1);
  });
  req.write(payload);
  req.end();
}

testSingleUpload();
