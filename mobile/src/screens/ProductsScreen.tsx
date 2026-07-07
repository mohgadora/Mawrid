import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { colors, spacing, radius, typography } from '../theme'
import { useStore } from '../store'
import { ProductCard, EmptyState } from '../components/common'
import { getProducts, searchProducts } from '../api'
import { t } from '../i18n'

export default function ProductsScreen({ navigation, route }: { navigation: any; route: any }) {
  const { lang, addToCart } = useStore()
  const isRTL = lang === 'ar'
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const categoryId = route?.params?.categoryId
  const categoryName = route?.params?.categoryName

  async function load(q?: string) {
    try {
      const data = q ? await searchProducts(q) : await getProducts({ category: categoryId })
      setProducts(data ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [categoryId])

  useEffect(() => {
    const timer = setTimeout(() => { load(query || undefined) }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 16, paddingHorizontal: spacing.lg }}>
        <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, textAlign: isRTL ? 'right' : 'left' }}>
          {categoryName ?? t('products')}
        </Text>
        <View style={{
          marginTop: spacing.sm,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          height: 44,
          gap: 8,
        }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}
            placeholder={t('search')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: colors.textSecondary, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          title={lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}
          subtitle={lang === 'ar' ? 'جرّب بحثاً مختلفاً' : 'Try a different search'}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: spacing.md }}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(query || undefined) }} tintColor={colors.primary} />}
          renderItem={({ item: p }) => (
            <ProductCard
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
                unit: p.unit ?? (lang === 'ar' ? 'قطعة' : 'unit'),
              })}
            />
          )}
        />
      )}
    </View>
  )
}
