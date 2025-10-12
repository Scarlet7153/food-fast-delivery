// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  // Get from environment variables
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'food_delivery',
  
  // Upload endpoint
  get uploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`
  },
  
  // Image transformations
  transformations: {
    thumbnail: 'w_300,h_200,c_fill',
    medium: 'w_600,h_400,c_fill',
    large: 'w_1200,h_800,c_fill',
  }
}

// Helper function to get transformed image URL
export const getCloudinaryUrl = (publicId, transformation = '') => {
  const { cloudName } = CLOUDINARY_CONFIG
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`
  
  if (transformation) {
    return `${baseUrl}/${transformation}/${publicId}`
  }
  
  return `${baseUrl}/${publicId}`
}

// Helper function to upload image to Cloudinary
export const uploadToCloudinary = async (file) => {
  const { uploadUrl, uploadPreset, cloudName } = CLOUDINARY_CONFIG
  
  // Validate configuration
  if (!cloudName || cloudName === 'your_cloud_name') {
    throw new Error('Cloudinary cloud name not configured. Please check your environment variables.')
  }
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const data = await response.json()
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}
