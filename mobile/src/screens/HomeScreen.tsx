import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { colors, spacing, radius, typography, shadow } from '../theme'
import { useStore } from '../store'
import { ProductCard } from '../components/common'
import { getProducts, getCategories, getFlashSales } from '../api'
import { t } from '../i18n'
import { formatPrice } from '../utils/format'

const categoryIcons: Record<string, string> = {
  default: '📦',
  food: '🥘',
  electronics: '📱',
  clothing: '👕',
  beauty: '💄',
  home: '🏠',
  sports: '⚽',
  auto: '🚗',
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, lang, currency, addToCart } = useStore()
  const isRTL = lang === 'ar'
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const [p, c, f] = await Promise.all([getProducts(), getCategories(), getFlashSales().catch(() => [])])
      setProducts(p?.slice(0, 10) ?? [])
      setCategories(c?.slice(0, 8) ?? [])
      setFlashSales(f?.slice(0, 5) ?? [])
    } catch {
      // silent fail — show empty
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const greeting = lang === 'ar'
    ? `مرحباً${user?.name ? `، ${user.name.split(' ')[0]}` : ''}! 👋`
    : `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋`

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 30, paddingHorizontal: spacing.lg }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, textAlign: isRTL ? 'right' : 'left' }}>
          {t('welcome')}
        </Text>
        <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, textAlign: isRTL ? 'right' : 'left' }}>
          {greeting}
        </Text>

        {/* Search Bar */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={{
            marginTop: spacing.md,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm }}>
            {t('search')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, marginTop: -16, backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: spacing.lg }}>

        {loading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Flash Sales Banner */}
            {flashSales.length > 0 && (
              <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.lg }}>
                <View style={{
                  backgroundColor: colors.error,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View>
                    <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.md }}>⚡ {t('flashSales')}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: typography.size.xs, marginTop: 2 }}>
                      {flashSales.length} {lang === 'ar' ? 'عرض متاح' : 'offers available'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Products', { filter: 'flash' })}>
                    <Text style={{ color: colors.white, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm }}>
                      {t('viewAll')} {isRTL ? '←' : '→'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <SectionHeader title={t('categories')} onViewAll={() => navigation.navigate('Products')} isRTL={isRTL} />
            )}
            {categories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => navigation.navigate('Products', { categoryId: c.id, categoryName: lang === 'ar' ? c.nameAr : c.name })}
                    style={{
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      minWidth: 80,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 28 }}>{categoryIcons[c.slug ?? ''] ?? '📦'}</Text>
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.text, marginTop: 6, textAlign: 'center' }}>
                      {lang === 'ar' ? (c.nameAr ?? c.name) : c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Featured Products */}
            {products.length > 0 && (
              <SectionHeader title={t('featuredProducts')} onViewAll={() => navigation.navigate('Products')} isRTL={isRTL} />
            )}
            {products.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.md, marginBottom: spacing.xl }}>
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    nameAr={p.nameAr ?? p.name}
                    price={p.price ?? 0}
                    imageUrl={p.imageUrl}
                    unit={p.unit}
                    onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                    onAddToCart={() => addToCart({
                      id: p.id,
                      productId: p.id,
                      name: p.name,
                      nameAr: p.nameAr ?? p.name,
                      price: p.price ?? 0,
                      imageUrl: p.imageUrl,
                      unit: p.unit ?? lang === 'ar' ? 'قطعة' : 'unit',
                    })}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

function SectionHeader({ title, onViewAll, isRTL }: { title: string; onViewAll: () => void; isRTL: boolean }) {
  return (
    <View style={{
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    }}>
      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.text }}>{title}</Text>
      <TouchableOpacity onPress={onViewAll}>
        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.primary }}>{t('viewAll')}</Text>
      </TouchableOpacity>
    </View>
  )
}
