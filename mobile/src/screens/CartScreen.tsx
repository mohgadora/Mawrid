import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { colors, spacing, radius, typography, shadow } from '../theme'
import { useStore } from '../store'
import { Button, EmptyState } from '../components/common'
import { t } from '../i18n'
import { formatPrice } from '../utils/format'

export default function CartScreen({ navigation }: { navigation: any }) {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, lang, currency } = useStore()
  const isRTL = lang === 'ar'

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('myCart')} isRTL={isRTL} />
        <EmptyState title={t('emptyCart')} subtitle={t('emptyCartSub')} />
      </View>
    )
  }

  const total = cartTotal()
  const tax = total * 0.15
  const shipping = 25

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={`${t('myCart')} (${cartCount()})`} isRTL={isRTL} />

      <FlatList
        data={cart}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => {
          const name = lang === 'ar' ? (item.nameAr ?? item.name) : item.name
          return (
            <View style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: spacing.md,
              alignItems: 'center',
            }}>
              {/* Image */}
              <View style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={{ width: 72, height: 72 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 32 }}>📦</Text>
                )}
              </View>

              {/* Details */}
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={2} style={{ fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>
                  {name}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.primary, textAlign: isRTL ? 'right' : 'left' }}>
                  {formatPrice(item.price * item.quantity, currency, lang)}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, textAlign: isRTL ? 'right' : 'left' }}>
                  {formatPrice(item.price, currency, lang)} × {item.quantity}
                </Text>

                {/* Qty controls */}
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm }}>
                    <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primary, fontSize: 18, fontFamily: typography.fontFamily.bold }}>−</Text>
                    </TouchableOpacity>
                    <Text style={{ width: 28, textAlign: 'center', fontFamily: typography.fontFamily.bold, color: colors.text }}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primary, fontSize: 18, fontFamily: typography.fontFamily.bold }}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                    <Text style={{ color: colors.error, fontSize: typography.size.sm, fontFamily: typography.fontFamily.medium }}>{t('remove')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )
        }}
      />

      {/* Summary */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.card,
        borderTopWidth: 1, borderColor: colors.border,
        padding: spacing.lg, paddingBottom: 34,
        ...shadow.md,
      }}>
        <Row label={t('subtotal')} value={formatPrice(total, currency, lang)} isRTL={isRTL} />
        <Row label={t('tax') + ' (15%)'} value={formatPrice(tax, currency, lang)} isRTL={isRTL} />
        <Row label={t('shipping')} value={formatPrice(shipping, currency, lang)} isRTL={isRTL} />
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
        <Row label={t('total')} value={formatPrice(total + tax + shipping, currency, lang)} isRTL={isRTL} bold />

        <Button
          label={t('checkout')}
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </View>
    </View>
  )
}

function ScreenHeader({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <View style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>{title}</Text>
    </View>
  )
}

function Row({ label, value, isRTL, bold }: { label: string; value: string; isRTL: boolean; bold?: boolean }) {
  return (
    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <Text style={{ fontFamily: bold ? typography.fontFamily.bold : typography.fontFamily.regular, color: bold ? colors.text : colors.textSecondary, fontSize: bold ? typography.size.base : typography.size.sm }}>{label}</Text>
      <Text style={{ fontFamily: typography.fontFamily.bold, color: bold ? colors.primary : colors.text, fontSize: bold ? typography.size.md : typography.size.sm }}>{value}</Text>
    </View>
  )
}
