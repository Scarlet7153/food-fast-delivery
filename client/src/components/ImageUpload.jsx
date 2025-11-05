import { useState } from 'react'
import { Image, Upload, X, Loader2, Maximize2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadToCloudinary } from '../config/cloudinary'

function ImageUpload({ value, onChange, className = '', disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [showFullScreen, setShowFullScreen] = useState(false)

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
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-96 object-cover rounded-lg border-2 border-gray-300 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => setShowFullScreen(true)}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Xóa ảnh"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowFullScreen(true)}
            className="absolute top-3 left-3 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
            title="Xem toàn màn hình"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Full Screen Modal */}
      {showFullScreen && preview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullScreen(false)}
        >
          <button
            onClick={() => setShowFullScreen(false)}
            className="absolute top-4 right-4 p-3 bg-white text-gray-800 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
            title="Đóng"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={preview}
            alt="Full Screen Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
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
                  PNG, JPG, JPEG (tối đa 5MB) - Tùy chọn
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Manual URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hoặc nhập URL ảnh <span className="text-gray-500 text-sm">(Tùy chọn)</span>
        </label>
        <input
          type="url"
          value={preview}
          onChange={(e) => {
            setPreview(e.target.value)
            onChange(e.target.value)
          }}
          className="input w-full"
          placeholder="https://example.com/image.jpg (không bắt buộc)"
          disabled={uploading}
        />
      </div>
    </div>
  )
}

export default ImageUpload
