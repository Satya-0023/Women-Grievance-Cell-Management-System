import ImageKit from 'imagekit';

// Create ImageKit instance only if credentials are provided
let imagekit = null;

if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    console.log('✅ ImageKit configured successfully');
} else {
    console.log('⚠️  ImageKit not configured - file uploads will be disabled');
    console.log('   To enable file uploads, add ImageKit credentials to .env file');
}

export default imagekit;
