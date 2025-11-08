import { useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { Navigation } from 'lucide-react'
import { formatMissionStatus } from '../utils/formatters'

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAQHXjTAKClEVWMwWUxRsT7MZYeoZY7iQ8'

function DroneTrackingMap({ mission }) {
  // Default coordinates (Ho Chi Minh City)
  const restaurantCoords = { lat: 10.7769, lng: 106.7009 } // District 1, HCMC
  const customerCoords = { lat: 10.8231, lng: 106.6297 } // Tan Binh, HCMC
  
  // Calculate drone position based on status
  const dronePosition = useMemo(() => {
    if (mission.status === 'PENDING') return restaurantCoords
    if (mission.status === 'DELIVERED') return customerCoords
    
    // IN_FLIGHT - position in between (60% of the way)
    const progress = 0.6
    return {
      lat: restaurantCoords.lat + (customerCoords.lat - restaurantCoords.lat) * progress,
      lng: restaurantCoords.lng + (customerCoords.lng - restaurantCoords.lng) * progress
    }
  }, [mission.status])

  // Calculate center and zoom to show all markers
  const mapCenter = useMemo(() => {
    return {
      lat: (restaurantCoords.lat + customerCoords.lat) / 2,
      lng: (restaurantCoords.lng + customerCoords.lng) / 2
    }
  }, [])

  // Route path
  const routePath = [restaurantCoords, customerCoords]

  return (
    <div className="space-y-4">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <div className="w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden shadow-lg">
          <Map
            defaultCenter={mapCenter}
            defaultZoom={14}
            mapId="drone-tracking-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={false}
          >
            {/* Restaurant Marker */}
            <AdvancedMarker
              position={restaurantCoords}
              title={mission.restaurant?.name || "Nhà hàng"}
            >
              <div style={{
                backgroundColor: '#10b981',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontSize: '20px',
                cursor: 'pointer'
              }}>
                🏪
              </div>
            </AdvancedMarker>

            {/* Customer Marker */}
            <AdvancedMarker
              position={customerCoords}
              title={mission.order?.customer?.name || "Khách hàng"}
            >
              <div style={{
                backgroundColor: '#ef4444',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                fontSize: '20px',
                cursor: 'pointer'
              }}>
                🏠
              </div>
            </AdvancedMarker>

            {/* Drone Marker */}
            {mission.status !== 'PENDING' && (
              <AdvancedMarker
                position={dronePosition}
                title={`${mission.droneId?.name || 'Drone'} - ${mission.droneId?.model || 'N/A'}`}
              >
                <div style={{
                  backgroundColor: '#6366f1',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.5)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  animation: mission.status === 'IN_FLIGHT' ? 'pulse 2s infinite' : 'none'
                }}>
                  🚁
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </div>
      </APIProvider>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
            🏪
          </div>
          <span>Nhà hàng</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
            🚁
          </div>
          <span>Drone {mission.status === 'IN_FLIGHT' && '(Đang bay)'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
            🏠
          </div>
          <span>Khách hàng</span>
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Navigation className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Trạng thái: <span className="text-blue-600">{formatMissionStatus(mission.status)}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Drone: {mission.drone?.name || mission.droneId?.name || 'Chưa phân công'} ({mission.drone?.model || mission.droneId?.model || 'N/A'})
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Khoảng cách ước tính</p>
            <p className="text-sm font-medium text-gray-900">~2.5 km</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}

export default DroneTrackingMap
