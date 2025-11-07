import { useState } from 'react'

function RatingModal({ rating, setRating, comment, setComment, onSubmit, onClose }) {
  const [hover, setHover] = useState(0)

  const descriptions = {
    1: 'Rất tệ',
    2: 'Tệ',
    3: 'Bình thường',
    4: 'Tốt',
    5: 'Tuyệt vời'
  }

  const active = hover || rating

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Đánh Giá Nhà Hàng</h3>
        <p className="text-sm text-gray-600 mb-6">Cho chúng tôi biết trải nghiệm của bạn.</p>

        <div className="space-y-6">
          {/* Rating Stars */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-medium text-gray-900">Đánh giá</label>
              <span className="text-sm text-gray-600">
                {active > 0 ? descriptions[active] : '-'}
              </span>
            </div>
            <div className="flex justify-center space-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className={`text-4xl transition-colors focus:outline-none ${
                    star <= active ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  aria-label={`${star} sao`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="font-medium text-gray-900 block mb-2">Nhận Xét (Tùy Chọn)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:border-primary-500"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">{comment.length}/500</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setRating(0)
              setComment('')
              onClose()
            }}
            className="btn btn-outline"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={rating === 0}
            className="btn btn-primary"
          >
            Gửi Đánh Giá
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal
