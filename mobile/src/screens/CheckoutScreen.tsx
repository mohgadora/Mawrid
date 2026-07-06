import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import { colors, spacing, radius, typography } from '../theme'
import { useStore } from '../store'
import { Button } from '../components/common'
import { createOrder } from '../api'
import { t } from '../i18n'
import { formatPrice } from '../utils/format'

export default function CheckoutScreen({ navigation }: { navigation: any }) {
  const { lang, currency, cart, cartTotal, clearCart, isAuthenticated } = useStore()
  const isRTL = lang === 'ar'
  const [address, setAddress] = useState({ label: lang === 'ar' ? 'الرئيسي' : 'Main', street: '', city: '' })
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod')
  const [loading, setLoading] = useState(false)

  const total = cartTotal()
  const tax = total * 0.15
  const shipping = 25

  async function handlePlaceOrder() {
    if (!isAuthenticated) {
      Alert.alert('', lang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first')
      return
    }
    if (!address.street.trim()) {
      Alert.alert('', lang === 'ar' ? 'أدخل عنوان التوصيل' : 'Enter delivery address')
      return
    }
    setLoading(true)
    try {
      await createOrder({
        lines: cart.map((item) => ({
          productId: item.productId,
          qty: item.quantity,
          unitPrice: item.price,
        })),
        address: { label: address.label, street: address.street, city: address.city },
        paymentMethod,
      })
      clearCart()
      Alert.alert(t('orderPlaced'), t('orderPlacedSub'), [
        { text: lang === 'ar' ? 'عرض طلباتي' : 'View Orders', onPress: () => navigation.navigate('Orders') },
        { text: lang === 'ar' ? 'الرئيسية' : 'Home', onPress: () => navigation.navigate('Home') },
      ])
    } catch {
      Alert.alert('', lang === 'ar' ? 'فشل تقديم الطلب' : 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 16, paddingHorizontal: spacing.lg, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.white, fontSize: 22 }}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg }}>{t('checkout')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* Address Section */}
        <SectionTitle title={t('shippingAddress')} isRTL={isRTL} />
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <TextInput
            style={[s.input, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={lang === 'ar' ? 'الشارع والحي' : 'Street & District'}
            placeholderTextColor={colors.textMuted}
            value={address.street}
            onChangeText={(v) => setAddress((a) => ({ ...a, street: v }))}
          />
          <TextInput
            style={[s.input, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={lang === 'ar' ? 'المدينة' : 'City'}
            placeholderTextColor={colors.textMuted}
            value={address.city}
            onChangeText={(v) => setAddress((a) => ({ ...a, city: v }))}
          />
        </View>

        {/* Payment Method */}
        <SectionTitle title={t('paymentMethod')} isRTL={isRTL} />
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {(['cod', 'bank_transfer'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: paymentMethod === method ? colors.primary : colors.border,
                padding: spacing.md,
              }}
            >
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: paymentMethod === method ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {paymentMethod === method && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
              </View>
              <Text style={{ fontFamily: typography.fontFamily.medium, color: colors.text }}>
                {method === 'cod' ? t('cod') : t('bankTransfer')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <SectionTitle title={lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'} isRTL={isRTL} />
        <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 8 }}>
          <Row label={lang === 'ar' ? `${cart.length} منتج` : `${cart.length} items`} value={formatPrice(total, currency, lang)} isRTL={isRTL} />
          <Row label={t('tax') + ' 15%'} value={formatPrice(tax, currency, lang)} isRTL={isRTL} />
          <Row label={t('shipping')} value={formatPrice(shipping, currency, lang)} isRTL={isRTL} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Row label={t('total')} value={formatPrice(total + tax + shipping, currency, lang)} isRTL={isRTL} bold />
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, padding: spacing.lg, paddingBottom: 34 }}>
        <Button label={t('placeOrder')} onPress={handlePlaceOrder} loading={loading} fullWidth size="lg" />
      </View>
    </View>
  )
}

function SectionTitle({ title, isRTL }: { title: string; isRTL: boolean }) {
  return (
    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.text, textAlign: isRTL ? 'right' : 'left', marginBottom: spacing.sm }}>
      {title}
    </Text>
  )
}

function Row({ label, value, isRTL, bold }: { label: string; value: string; isRTL: boolean; bold?: boolean }) {
  return (
    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: bold ? typography.fontFamily.bold : typography.fontFamily.regular, color: bold ? colors.text : colors.textSecondary }}>{label}</Text>
      <Text style={{ fontFamily: typography.fontFamily.bold, color: bold ? colors.primary : colors.text }}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  input: {
    height: 48,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
    color: colors.text,
  },
})
