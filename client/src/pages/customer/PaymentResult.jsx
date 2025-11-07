import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { paymentService } from '../../services/paymentService'

function PaymentResult() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get params from MoMo callback
        const partnerCode = searchParams.get('partnerCode')
        const orderId = searchParams.get('orderId')
        const requestId = searchParams.get('requestId')
        const amount = searchParams.get('amount')
        const orderInfo = searchParams.get('orderInfo')
        const orderType = searchParams.get('orderType')
        const transId = searchParams.get('transId')
        const resultCode = searchParams.get('resultCode')
        const message = searchParams.get('message')
        const payType = searchParams.get('payType')
        const responseTime = searchParams.get('responseTime')
        const extraData = searchParams.get('extraData')
        const signature = searchParams.get('signature')

        if (!orderId || !resultCode) {
          setStatus('failed')
          return
        }

        // Check result code from MoMo
        if (resultCode === '0') {
          // Payment successful - verify and update order status
          try {
            // Call backend to verify signature and update order
            const verifyResponse = await paymentService.verifyMoMoPayment({
              partnerCode,
              orderId,
              requestId,
              amount,
              orderInfo,
              orderType,
              transId,
              resultCode,
              message,
              payType,
              responseTime,
              extraData,
              signature
            })
            
            if (verifyResponse.success) {
              setStatus('success')
              setPaymentInfo({
                orderId: verifyResponse.data.orderId, // Real order ID from backend
                transId,
                amount,
                orderInfo,
                message: 'Thanh toán thành công'
              })
            } else {
              setStatus('failed')
              setPaymentInfo({
                message: 'Xác thực thanh toán thất bại'
              })
            }
          } catch (verifyError) {
            console.error('Verify payment error:', verifyError)
            setStatus('failed')
            setPaymentInfo({
              message: 'Không thể xác thực thanh toán'
            })
          }
        } else {
          // Payment failed
          setStatus('failed')
          setPaymentInfo({
            orderId,
            message: message || 'Thanh toán thất bại',
            resultCode
          })
        }
      } catch (error) {
        console.error('Verify payment error:', error)
        setStatus('failed')
      }
    }

    verifyPayment()
  }, [searchParams])

  const handleContinue = () => {
    if (status === 'success' && paymentInfo?.orderId) {
      navigate(`/customer/orders/${paymentInfo.orderId}`)
    } else {
      navigate('/customer/orders')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Đang xác nhận thanh toán...
            </h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              {paymentInfo?.message || 'Đơn hàng của bạn đã được thanh toán'}
            </p>

            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-left">
                {paymentInfo.transId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-medium text-gray-900">{paymentInfo.transId}</span>
                  </div>
                )}
                {paymentInfo.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-medium text-gray-900">
                      {parseInt(paymentInfo.amount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}
                {paymentInfo.orderInfo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thông tin:</span>
                    <span className="font-medium text-gray-900">{paymentInfo.orderInfo}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleContinue}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              <span>Xem chi tiết đơn hàng</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-gray-600 mb-6">
              {paymentInfo?.message || 'Đã có lỗi xảy ra trong quá trình thanh toán'}
            </p>

            {paymentInfo?.resultCode && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Mã lỗi: <span className="font-medium text-gray-900">{paymentInfo.resultCode}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="btn btn-primary w-full"
              >
                Về trang đơn hàng
              </button>
              <button
                onClick={() => navigate('/customer/home')}
                className="btn btn-outline w-full"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentResult
