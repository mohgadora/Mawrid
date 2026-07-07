'use client'
/**
 * lib/use-products.ts — كتالوج مشترك من /api/v1/products
 */
import useSWR from 'swr'
import type { Product } from '@/lib/data'

async function fetchAllProducts(): Promise<Product[]> {
  const res = await fetch('/api/v1/products?limit=500')
  if (!res.ok) throw new Error('Failed to fetch products')
  const json = await res.json()
  if (Array.isArray(json)) return json
  if (json?.data && Array.isArray(json.data)) return json.data
  if (json?.products && Array.isArray(json.products)) return json.products
  return []
}

export function useProducts() {
  const { data, error, isLoading } = useSWR<Product[]>('__all_products__', fetchAllProducts, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
  })
  return { products: data ?? [], error, isLoading }
}
