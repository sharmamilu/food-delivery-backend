const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Debug: Check if environment variables are loaded
console.log('Cloudinary Config Check:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Loaded' : 'Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Loaded' : 'Missing');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test the configuration
console.log('Cloudinary config initialized:', cloudinary.config().cloud_name ? 'Yes' : 'No');

module.exports = cloudinary;