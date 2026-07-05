/**
 * services/driver-tracking.ts
 *
 * Driver-tracking data layer — mock today, real GPS feed tomorrow.
 * Swap the body of getDrivers() for a real API call with no screen changes.
 *
 * Shapes are API-ready: lat/lng come from the live GPS feed, status from the
 * dispatch system, currentOrderId/etaMinutes from the order service.
 */

export type DriverStatus =
  | 'available'     // متاح
  | 'busy'          // مشغول
  | 'late'          // متأخر
  | 'returning'     // عائد
  | 'offline'       // غير متصل
  | 'break'         // استراحة

export type Driver = {
  id: string
  name: string
  phone: string
  vehicle: string
  vehiclePlate: string
  lat: number
  lng: number
  status: DriverStatus
  currentOrderId: string | null
  etaMinutes: number | null
  lateByMinutes: number | null
  lastUpdated: string   // ISO timestamp
  /** Mock pickup→drop-off route for selected driver */
  route: Array<{ lat: number; lng: number }>
}

// ── Mock data — 14 drivers scattered across Riyadh ─────────────────────────

const NOW = new Date().toISOString()

const MOCK_DRIVERS: Driver[] = [
  {
    id: 'DRV-001', name: 'أحمد العمري', phone: '+966 50 111 2233',
    vehicle: 'دايهاتسو هايجيت', vehiclePlate: 'أ ب ج 1234',
    lat: 24.7136, lng: 46.6753, status: 'available',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: NOW,
    route: [],
  },
  {
    id: 'DRV-002', name: 'محمد السعيدي', phone: '+966 55 222 3344',
    vehicle: 'تويوتا هايلوكس', vehiclePlate: 'د هـ و 5678',
    lat: 24.6877, lng: 46.7219, status: 'busy',
    currentOrderId: 'ORD-8821', etaMinutes: 12, lateByMinutes: null,
    lastUpdated: NOW,
    route: [
      { lat: 24.7010, lng: 46.7100 },
      { lat: 24.6950, lng: 46.7160 },
      { lat: 24.6877, lng: 46.7219 },
    ],
  },
  {
    id: 'DRV-003', name: 'خالد الرشيدي', phone: '+966 54 333 4455',
    vehicle: 'نيسان أورفان', vehiclePlate: 'ز ح ط 9012',
    lat: 24.7302, lng: 46.6582, status: 'late',
    currentOrderId: 'ORD-8799', etaMinutes: 28, lateByMinutes: 18,
    lastUpdated: NOW,
    route: [
      { lat: 24.7400, lng: 46.6400 },
      { lat: 24.7350, lng: 46.6490 },
      { lat: 24.7302, lng: 46.6582 },
    ],
  },
  {
    id: 'DRV-004', name: 'عبدالله القحطاني', phone: '+966 56 444 5566',
    vehicle: 'ميتسوبيشي L200', vehiclePlate: 'ي ك ل 3456',
    lat: 24.6990, lng: 46.7450, status: 'returning',
    currentOrderId: null, etaMinutes: 7, lateByMinutes: null,
    lastUpdated: NOW,
    route: [
      { lat: 24.6990, lng: 46.7450 },
      { lat: 24.7050, lng: 46.7300 },
      { lat: 24.7136, lng: 46.6753 },
    ],
  },
  {
    id: 'DRV-005', name: 'فيصل الزهراني', phone: '+966 50 555 6677',
    vehicle: 'فورد ترانزيت', vehiclePlate: 'م ن هـ 7890',
    lat: 24.7450, lng: 46.6900, status: 'offline',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    route: [],
  },
  {
    id: 'DRV-006', name: 'سعد البلوي', phone: '+966 55 666 7788',
    vehicle: 'تويوتا كامري', vehiclePlate: 'و ز ح 2345',
    lat: 24.7020, lng: 46.6600, status: 'break',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: NOW,
    route: [],
  },
  {
    id: 'DRV-007', name: 'عمر الغامدي', phone: '+966 54 777 8899',
    vehicle: 'كيا بونغو', vehiclePlate: 'ط ي ك 6789',
    lat: 24.7200, lng: 46.7100, status: 'busy',
    currentOrderId: 'ORD-8834', etaMinutes: 5, lateByMinutes: null,
    lastUpdated: NOW,
    route: [
      { lat: 24.7350, lng: 46.6950 },
      { lat: 24.7280, lng: 46.7020 },
      { lat: 24.7200, lng: 46.7100 },
    ],
  },
  {
    id: 'DRV-008', name: 'يوسف المطيري', phone: '+966 56 888 9900',
    vehicle: 'هوندا أكتي', vehiclePlate: 'ل م ن 0123',
    lat: 24.6800, lng: 46.6900, status: 'late',
    currentOrderId: 'ORD-8810', etaMinutes: 45, lateByMinutes: 25,
    lastUpdated: NOW,
    route: [
      { lat: 24.7000, lng: 46.6700 },
      { lat: 24.6900, lng: 46.6800 },
      { lat: 24.6800, lng: 46.6900 },
    ],
  },
  {
    id: 'DRV-009', name: 'إبراهيم العسيري', phone: '+966 50 999 0011',
    vehicle: 'سوزوكي كاري', vehiclePlate: 'هـ و ز 4567',
    lat: 24.7500, lng: 46.7200, status: 'available',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: NOW,
    route: [],
  },
  {
    id: 'DRV-010', name: 'ناصر الدوسري', phone: '+966 55 000 1122',
    vehicle: 'نيسان NV200', vehiclePlate: 'ح ط ي 8901',
    lat: 24.7100, lng: 46.6400, status: 'busy',
    currentOrderId: 'ORD-8856', etaMinutes: 20, lateByMinutes: null,
    lastUpdated: NOW,
    route: [
      { lat: 24.7250, lng: 46.6250 },
      { lat: 24.7180, lng: 46.6320 },
      { lat: 24.7100, lng: 46.6400 },
    ],
  },
  {
    id: 'DRV-011', name: 'طارق الشهري', phone: '+966 54 111 2233',
    vehicle: 'تويوتا هايس', vehiclePlate: 'ك ل م 2345',
    lat: 24.6650, lng: 46.7500, status: 'returning',
    currentOrderId: null, etaMinutes: 15, lateByMinutes: null,
    lastUpdated: NOW,
    route: [
      { lat: 24.6650, lng: 46.7500 },
      { lat: 24.6900, lng: 46.7200 },
      { lat: 24.7136, lng: 46.6753 },
    ],
  },
  {
    id: 'DRV-012', name: 'حمد المنصور', phone: '+966 56 222 3344',
    vehicle: 'فولكسفاغن كرافتر', vehiclePlate: 'ن هـ و 6789',
    lat: 24.7350, lng: 46.6200, status: 'offline',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    route: [],
  },
  {
    id: 'DRV-013', name: 'سلطان العتيبي', phone: '+966 50 333 4455',
    vehicle: 'مرسيدس سبرينتر', vehiclePlate: 'ز ح ط 0123',
    lat: 24.6750, lng: 46.6500, status: 'available',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: NOW,
    route: [],
  },
  {
    id: 'DRV-014', name: 'بدر الحربي', phone: '+966 55 444 5566',
    vehicle: 'إيسوزو NPR', vehiclePlate: 'ي ك ل 4567',
    lat: 24.7600, lng: 46.6700, status: 'break',
    currentOrderId: null, etaMinutes: null, lateByMinutes: null,
    lastUpdated: NOW,
    route: [],
  },
]

const delay = () => new Promise<void>((r) => setTimeout(r, 0))

// In-memory mutable copy so live-update simulation can mutate positions
let DRIVERS = MOCK_DRIVERS.map((d) => ({ ...d }))

export async function getDrivers(): Promise<Driver[]> {
  await delay()
  return DRIVERS
}

/**
 * Simulate live GPS update — called by the interval in the map screen.
 * In production: replace with a WebSocket or SSE feed.
 */
export async function refreshDriverPositions(): Promise<Driver[]> {
  await delay()
  DRIVERS = DRIVERS.map((d) => {
    if (d.status === 'offline') return { ...d }
    // Drift each driver a tiny random amount (±0.0005°) to simulate movement
    return {
      ...d,
      lat: d.lat + (Math.random() - 0.5) * 0.001,
      lng: d.lng + (Math.random() - 0.5) * 0.001,
      lastUpdated: new Date().toISOString(),
    }
  })
  return DRIVERS
}
