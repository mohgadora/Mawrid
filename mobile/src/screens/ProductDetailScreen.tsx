import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { colors, spacing, radius, typography, shadow } from '../theme'
import { useStore } from '../store'
import { Button, StatusBadge } from '../components/common'
import { getProduct, getProducts } from '../api'
import { t } from '../i18n'
import { formatPrice } from '../utils/format'

export default function ProductDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const productId = route.params?.productId
  const { lang, currency, addToCart } = useStore()
  const isRTL = lang === 'ar'
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        let p = productId ? await getProduct(productId) : null
        // Opened as a direct page (no id) or not found — fall back to the catalog.
        if (!p) {
          const all = await getProducts()
          p = (productId && all.find((x: any) => x.id === productId)) || all[0] || null
        }
        if (active) setProduct(p)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [productId])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>{lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</Text>
      </View>
    )
  }

  const name = lang === 'ar' ? (product.nameAr ?? product.name) : product.name
  const description = lang === 'ar' ? (product.descriptionAr ?? product.description) : product.description
  const price = product.price ?? 0
  const inStock = (product.stock ?? 999) > 0

  function handleAddToCart() {
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr ?? product.name,
      price,
      imageUrl: product.imageUrl,
      unit: product.unit ?? (lang === 'ar' ? 'قطعة' : 'unit'),
      quantity: qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    handleAddToCart()
    navigation.navigate('Main', { screen: 'Cart' })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: 50, left: isRTL ? undefined : 16, right: isRTL ? 16 : undefined, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: radius.full, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: colors.white, fontSize: 20 }}>{isRTL ? '→' : '←'}</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={{ height: 300, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 80 }}>📦</Text>
          )}
        </View>

        <View style={{ padding: spacing.lg }}>
          {/* Name & Price */}
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>
            {name}
          </Text>

          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xxl, color: colors.primary }}>
              {formatPrice(price, currency, lang)}
            </Text>
            <StatusBadge status={inStock ? 'completed' : 'cancelled'} label={inStock ? t('inStock') : t('outOfStock')} />
          </View>

          {product.unit && (
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
              {lang === 'ar' ? 'لكل' : 'per'} {product.unit}
            </Text>
          )}

          {product.minOrderQty && product.minOrderQty > 1 && (
            <View style={{ backgroundColor: colors.warningLight, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm }}>
              <Text style={{ color: colors.warning, fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, textAlign: isRTL ? 'right' : 'left' }}>
                {t('minOrder')}: {product.minOrderQty} {product.unit ?? (lang === 'ar' ? 'قطعة' : 'unit')}
              </Text>
            </View>
          )}

          {/* Qty picker (always shown so shoppers can choose quantity) */}
          {(
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
              <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.textSecondary }}>{t('quantity')}:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 4 }}>
                <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: colors.primary, fontFamily: typography.fontFamily.bold }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.text, minWidth: 30, textAlign: 'center' }}>{qty}</Text>
                <TouchableOpacity onPress={() => setQty(qty + 1)} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, color: colors.primary, fontFamily: typography.fontFamily.bold }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          {description && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.text, textAlign: isRTL ? 'right' : 'left', marginBottom: spacing.sm }}>
                {t('description')}
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: 22, textAlign: isRTL ? 'right' : 'left' }}>
                {description}
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar (always visible) */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, padding: spacing.md, paddingBottom: 30, gap: spacing.sm }}>
        {added && (
          <Text style={{ color: colors.success, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm, textAlign: 'center', marginBottom: spacing.sm }}>
            {lang === 'ar' ? 'تمت الإضافة إلى السلة ✓' : 'Added to cart ✓'}
          </Text>
        )}
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing.sm }}>
          <Button label={t('addToCart')} onPress={handleAddToCart} variant="outline" style={{ flex: 1 }} fullWidth={false} disabled={!inStock} />
          <Button label={t('buyNow')} onPress={handleBuyNow} style={{ flex: 1 }} fullWidth={false} disabled={!inStock} />
        </View>
      </View>
    </View>
  )
}
