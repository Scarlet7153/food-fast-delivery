import { useState } from 'react'
import { Image, Upload, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadToCloudinary } from '../config/cloudinary'

function ImageUpload({ value, onChange, className = '', disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB')
      return
    }

    setUploading(true)
    
    try {
      const result = await uploadToCloudinary(file)
      
      if (result.success) {
        setPreview(result.url)
        onChange(result.url)
        toast.success('Upload ảnh thành công')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Không thể upload ảnh. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    onChange('')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
          id="image-upload"
        />
        
        <label
          htmlFor="image-upload"
          className={`cursor-pointer ${uploading || disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Đang upload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {preview ? 'Thay đổi ảnh' : 'Chọn ảnh từ máy'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, JPEG (tối đa 5MB)
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Manual URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hoặc nhập URL ảnh
        </label>
        <input
          type="url"
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value)
            onChange(e.target.value)
          }}
          className="input w-full"
          placeholder="https://example.com/image.jpg"
          disabled={uploading}
        />
      </div>
    </div>
  )
}

export default ImageUpload
