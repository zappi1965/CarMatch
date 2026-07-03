import { enabledProviders } from '../config.js'
import type { VehicleProviderAdapter } from './types.js'
import { DemoProviderAdapter } from './demo/DemoProviderAdapter.js'
import { MobileDeAdapter } from './mobileDe/MobileDeAdapter.js'
import { AutoScout24Adapter } from './autoscout24/AutoScout24Adapter.js'
import { GenericPartnerFeedAdapter } from './partnerFeed/GenericPartnerFeedAdapter.js'

const allAdapters: VehicleProviderAdapter[] = [
  new DemoProviderAdapter(),
  new MobileDeAdapter(),
  new AutoScout24Adapter(),
  new GenericPartnerFeedAdapter(),
]

/** Aktive Adapter: per ENV freigeschaltet UND konfiguriert. */
export function getActiveAdapters(): VehicleProviderAdapter[] {
  return allAdapters.filter((a) => enabledProviders.includes(a.key) && a.isConfigured())
}

export function getAdapter(key: string): VehicleProviderAdapter | undefined {
  return allAdapters.find((a) => a.key === key)
}

export function getAllAdapters(): VehicleProviderAdapter[] {
  return allAdapters
}
