import cloudinary from '../config/cloudinary.js';

async function testCloudinaryConnection() {
  console.log('\n==================================================');
  console.log('   TESTING CLOUDINARY MEDIA STORAGE CONNECTION    ');
  console.log('==================================================\n');

  console.log('Credentials configured:');
  console.log(`- Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME || '(Not set)'}`);
  console.log(`- API Key:    ${process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.slice(0, 6) + '***' : '(Not set)'}`);
  console.log(`- API Secret: ${process.env.CLOUDINARY_API_SECRET ? 'Configured (Hidden)' : '(Not set)'}\n`);

  try {
    // 1. Test Cloudinary API Ping / Account Info
    console.log('1. Pinging Cloudinary API...');
    const pingResult = await cloudinary.api.ping();
    console.log('   ✅ Cloudinary Ping Status:', pingResult.status || 'OK');

    // 2. Upload a test 1x1 PNG image data URI
    console.log('\n2. Uploading test image asset to Cloudinary...');
    const sampleImageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const uploadResult = await cloudinary.uploader.upload(sampleImageDataUri, {
      folder: 'miraya_test_uploads',
      public_id: `test_image_${Date.now()}`,
      overwrite: true,
    });

    console.log('   ✅ Upload Success!');
    console.log('   - Public ID:  ', uploadResult.public_id);
    console.log('   - Secure URL: ', uploadResult.secure_url);
    console.log('   - Format:     ', uploadResult.format);
    console.log('   - Size:       ', uploadResult.bytes, 'bytes');

    // 3. Clean up test upload
    console.log('\n3. Cleaning up test image asset from Cloudinary...');
    const destroyResult = await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('   ✅ Cleanup Status:', destroyResult.result || 'ok');

    console.log('\n==================================================');
    console.log('  🎉 CLOUDINARY IS 100% WORKING & PRODUCTION READY');
    console.log('==================================================\n');
  } catch (error) {
    console.error('\n❌ CLOUDINARY TEST FAILED!');
    console.error('Error Code:', error.http_code || error.code || 'UNKNOWN');
    console.error('Error Message:', error.message || error);
    console.log('\n==================================================\n');
  }
}

testCloudinaryConnection();
