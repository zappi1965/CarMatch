import type { GeoPoint } from './types/filters.js'

const EARTH_RADIUS_KM = 6371

/** Haversine-Distanz in km. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Bounding-Box für Radius-Vorfilterung in SQL (grob, danach exakte Haversine-Prüfung).
 */
export function boundingBox(center: GeoPoint, radiusKm: number) {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)
  const lonDelta = latDelta / Math.max(0.01, Math.cos(toRad(center.latitude)))
  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  }
}

export function withinRadius(center: GeoPoint, point: GeoPoint, radiusKm: number): boolean {
  return distanceKm(center, point) <= radiusKm
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
