import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Booking } from "@/lib/types"
import { format } from "date-fns"
import { Calendar, MapPin, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

// Custom SVG Pin for Dark Mode Map
const createTourPinIcon = (isSelected = false) => {
  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#317978" flood-opacity="0.8"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 24 16 24s16-13.5 16-24c0-8.837-7.163-16-16-16z" 
            fill="${isSelected ? '#10B981' : '#317978'}" 
            stroke="#ffffff" 
            stroke-width="2" 
            filter="url(#glow)"/>
      <circle cx="16" cy="16" r="6" fill="#ffffff"/>
      <circle cx="16" cy="16" r="3" fill="${isSelected ? '#10B981' : '#113B3A'}"/>
    </svg>
  `
  return L.divIcon({
    className: "custom-tour-pin",
    html: pinSvg,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  })
}

// Controller component to automatically center the map on the plotted pins
function MapBoundsController({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates.length === 0) return

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 12, { animate: true })
    } else {
      const bounds = L.latLngBounds(coordinates)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true })
    }
  }, [coordinates, map])

  return null
}

interface TravelerBookingsMapProps {
  bookings: Booking[]
  selectedBookingId?: string | null
  onSelectBooking?: (bookingId: string) => void
  className?: string
}

export function TravelerBookingsMap({
  bookings,
  selectedBookingId,
  onSelectBooking,
  className = "h-[450px] md:h-[600px] w-full rounded-2xl overflow-hidden border border-border/40 shadow-neo-pill",
}: TravelerBookingsMapProps) {
  // Filter bookings that have valid coordinates
  const toursWithCoords = useMemo(() => {
    return bookings
      .filter((b) => {
        const lat = b.tour?.latitude
        const lng = b.tour?.longitude
        return (
          lat !== undefined &&
          lng !== undefined &&
          !isNaN(Number(lat)) &&
          !isNaN(Number(lng)) &&
          Number(lat) !== 0 &&
          Number(lng) !== 0
        )
      })
      .map((b) => ({
        booking: b,
        lat: Number(b.tour!.latitude),
        lng: Number(b.tour!.longitude),
      }))
  }, [bookings])

  const coordinates: [number, number][] = useMemo(
    () => toursWithCoords.map((item) => [item.lat, item.lng]),
    [toursWithCoords]
  )

  // Default center: Kenya / Nairobi (-1.2921, 36.8219)
  const defaultCenter: [number, number] = coordinates.length > 0 ? coordinates[0] : [-1.2921, 36.8219]

  return (
    <div className={`relative ${className} z-0 bg-[#16161A]`}>
      <MapContainer
        center={defaultCenter}
        zoom={coordinates.length > 0 ? 11 : 7}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#111827" }}
      >
        {/* Dark-Mode OpenStreetMap Tile Layer via CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapBoundsController coordinates={coordinates} />

        {toursWithCoords.map(({ booking, lat, lng }) => {
          const isSelected = selectedBookingId === booking.id
          const tour = booking.tour

          return (
            <Marker
              key={booking.id}
              position={[lat, lng]}
              icon={createTourPinIcon(isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectBooking) onSelectBooking(booking.id)
                },
              }}
            >
              <Popup className="dark-leaflet-popup">
                <div className="p-1 min-w-[200px] text-zinc-900 dark:text-zinc-100">
                  {tour?.images?.[0] && (
                    <img
                      src={tour.images[0]}
                      alt={tour.title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                  <h4 className="font-bold text-sm leading-snug line-clamp-2 text-foreground">
                    {tour?.title || "Tour Experience"}
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="size-3 text-brand shrink-0" />
                    <span className="truncate">{tour?.location_name || "Kenya"}</span>
                  </p>
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="size-3" />
                      {format(new Date(booking.booking_date), "MMM d, yyyy")}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {booking.status}
                    </Badge>
                  </div>
                  {tour?.id && (
                    <div className="mt-2 text-right">
                      <Link
                        to={`/tours/${tour.id}`}
                        className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-0.5"
                      >
                        View Tour <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Overlay legend / status */}
      <div className="absolute top-3 right-3 z-[1000] bg-background/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/40 text-xs font-medium text-foreground flex items-center gap-2 shadow-sm pointer-events-none">
        <span className="size-2 rounded-full bg-brand animate-pulse" />
        <span>{toursWithCoords.length} Booked Tour Locations</span>
      </div>
    </div>
  )
}
