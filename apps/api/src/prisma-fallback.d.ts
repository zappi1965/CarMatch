/** Fallback declarations for offline checks before `prisma generate` creates a typed client. */
declare module '@prisma/client' {
  export type LeadType = 'GENERAL' | 'TEST_DRIVE' | 'FINANCE' | 'AVAILABILITY' | 'CALLBACK' | 'MESSAGE'
  export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUGIN_HYBRID' | 'LPG' | 'CNG' | 'OTHER'
  export type VehicleModel = any
  export type VehicleListing = any
  export namespace Prisma { export type VehicleListingWhereInput = any }
  export class PrismaClient {
    [key: string]: any
    constructor(...args: any[])
    $connect(): Promise<void>
    $disconnect(): Promise<void>
  }
}
