'use client'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix default icon issues
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ location }: { location: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 14);
        }
    }, [location, map]);
    return null;
}

export default function EventMap({
    events,
    userLocation,
    onEventSelect
}: {
    events: any[],
    userLocation: [number, number] | null,
    onEventSelect: (event: any) => void
}) {
    const defaultCenter: [number, number] = [40.7128, -74.0060];

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-white/10 relative z-0">
            <MapContainer
                center={defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {userLocation && <MapController location={userLocation} />}

                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>You</Popup>
                    </Marker>
                )}

                {events.map((event) => (
                    <Marker
                        key={event.id}
                        position={[event.lat, event.lng]}
                        eventHandlers={{
                            click: () => onEventSelect(event),
                        }}
                    >
                        <Popup>
                            <div className="p-2 space-y-1">
                                <h4 className="font-bold text-blue-600">{event.title}</h4>
                                <p className="text-xs text-gray-600">{event.description.slice(0, 50)}...</p>
                                <button
                                    onClick={() => onEventSelect(event)}
                                    className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded w-full font-bold"
                                >
                                    OPEN SECTOR
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
