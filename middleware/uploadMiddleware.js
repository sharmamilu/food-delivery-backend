const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (file, folder = 'payment_screenshots') => {
  try {
    console.log("Uploading to Cloudinary, folder:", folder);
    console.log("File type:", typeof file);
    console.log("File preview:", file?.substring(0, 100));
    
    let uploadResponse;
    
    // Check if file is base64 string
    if (typeof file === 'string' && file.startsWith('data:image')) {
      console.log('Uploading base64 image');
      uploadResponse = await cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'image',
      });
    } 
    // Check if file is a blob URL (React Native) - CANNOT UPLOAD DIRECTLY!
    else if (typeof file === 'string' && file.includes('blob:')) {
      console.error('Received blob URL - cannot upload directly from server!');
      console.error('Blob URLs are client-side only and must be converted to base64 before sending to server.');
      throw new Error('Blob URLs cannot be uploaded directly. Please convert to base64 on client side first.');
    }
    // Check if it's a regular URL (not blob)
    else if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
      console.log('Uploading from URL:', file);
      uploadResponse = await cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: 'image',
      });
    }
    // If it's a Buffer (from multer)
    else if (Buffer.isBuffer(file)) {
      console.log('Uploading Buffer, size:', file.length);
      // Convert buffer to base64
      const base64Image = `data:image/jpeg;base64,${file.toString('base64')}`;
      uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: folder,
        resource_type: 'image',
      });
    }
    // Handle other cases
    else {
      console.error('Unsupported file format:', typeof file);
      throw new Error(`Unsupported file format. Expected base64, URL, or Buffer, got: ${typeof file}`);
    }
    
    console.log('Upload successful! URL:', uploadResponse.secure_url);
    console.log('Public ID:', uploadResponse.public_id);
    console.log('Folder created/used:', uploadResponse.folder || folder);
    
    return {
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error details:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
};