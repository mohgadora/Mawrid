import {
  Wheat,
  Droplet,
  CupSoda,
  Archive,
  SprayCan,
  Cookie,
  Milk,
  Candy,
  Package,
  type LucideProps,
} from 'lucide-react'

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  wheat: Wheat,
  droplet: Droplet,
  'cup-soda': CupSoda,
  archive: Archive,
  'spray-can': SprayCan,
  cookie: Cookie,
  milk: Milk,
  candy: Candy,
}

export function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = MAP[name] ?? Package
  return <Icon {...props} />
}
