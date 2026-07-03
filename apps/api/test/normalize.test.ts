import { describe, expect, it } from 'vitest'
import { normalizeMobileDeAd, type MobileDeRawAd } from '../src/providers/mobileDe/normalize.js'
import { GenericPartnerFeedAdapter } from '../src/providers/partnerFeed/GenericPartnerFeedAdapter.js'
import { DemoProviderAdapter } from '../src/providers/demo/DemoProviderAdapter.js'

const rawAd: MobileDeRawAd = {
  mobileAdId: 12345,
  detailPageUrl: 'https://suchen.mobile.de/fahrzeuge/details.html?id=12345',
  make: 'BMW', model: '340', modelDescription: 'M340i xDrive Touring',
  price: { consumerPriceGross: '54900.00', currency: 'EUR' },
  firstRegistration: '202106',
  mileage: 48200, power: 275, fuel: 'PETROL', gearbox: 'AUTOMATIC_GEAR',
  category: 'Kombi', doorCount: '4/5', seats: 5,
  images: [{ xxl: 'https://img.example/1.jpg' }, { l: 'https://img.example/2.jpg' }],
  seller: {
    type: 'DEALER', companyName: 'Autohaus X',
    address: { zipcode: '18055', city: 'Rostock', countryCode: 'DE' },
    coordinates: { latitude: 54.09, longitude: 12.14 },
  },
}

describe('Provider-Normalisierung', () => {
  it('mobile.de: mappt Rohdaten vollständig ins NormalizedListing', () => {
    const l = normalizeMobileDeAd(rawAd)
    expect(l.provider).toBe('mobile_de')
    expect(l.providerListingId).toBe('12345')
    expect(l.price).toBe(54900)
    expect(l.year).toBe(2021)
    expect(l.firstRegistration).toBe('2021-06')
    expect(l.powerKw).toBe(275)
    expect(l.powerHp).toBe(374) // 275 kW * 1.35962
    expect(l.fuelType).toBe('PETROL')
    expect(l.transmission).toBe('AUTOMATIC')
    expect(l.bodyType).toBe('WAGON')
    expect(l.images).toHaveLength(2)
    expect(l.sellerType).toBe('DEALER')
    expect(l.city).toBe('Rostock')
    expect(l.imagesAreDemo).toBe(false)
    expect(l.rawData).toBe(rawAd) // Rohdaten für Debugging erhalten
  })

  it('mobile.de: unbekannte Werte werden nicht erfunden', () => {
    const l = normalizeMobileDeAd({ mobileAdId: 1, make: 'Audi' })
    expect(l.year).toBeUndefined()
    expect(l.fuelType).toBeUndefined()
    expect(l.accidentFree).toBeNull() // Datenlage unklar ≠ unfallfrei
  })

  it('PartnerFeed: lehnt unvollständige Einträge ab', () => {
    const adapter = new GenericPartnerFeedAdapter()
    expect(() => adapter.normalizeListing({ make: 'BMW' })).toThrow()
    const ok = adapter.normalizeListing({
      providerListingId: 'p1', make: 'BMW', model: 'i4', title: 'BMW i4', price: 45000, powerKw: 250,
    })
    expect(ok.provider).toBe('partner_feed')
    expect(ok.powerHp).toBe(340)
  })

  it('Demo-Provider: kennzeichnet alle Inserate als Demo', async () => {
    const adapter = new DemoProviderAdapter()
    const listings = await adapter.syncListings()
    expect(listings.length).toBeGreaterThanOrEqual(20)
    for (const l of listings) {
      expect(l.provider).toBe('demo')
      expect(l.imagesAreDemo).toBe(true)
      expect(l.price).toBeGreaterThan(0)
    }
  })

  it('Demo-Provider: Umkreissuche filtert korrekt', async () => {
    const adapter = new DemoProviderAdapter()
    const near = await adapter.searchListings({}, {
      point: { latitude: 54.0924, longitude: 12.1407 }, // Rostock
      radiusKm: 50,
    })
    const all = await adapter.syncListings()
    expect(near.length).toBeGreaterThan(0)
    expect(near.length).toBeLessThan(all.length)
    for (const l of near) expect(['Rostock', 'Wismar'].includes(l.city!)).toBe(true)
  })
})
