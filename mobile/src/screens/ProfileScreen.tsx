import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native'
import { colors, spacing, radius, typography, shadow } from '../theme'
import { useStore, type Currency } from '../store'
import { Button } from '../components/common'
import { t, setLocale } from '../i18n'
import { I18nManager } from 'react-native'

type MenuItem = {
  icon: string
  label: string
  onPress: () => void
  danger?: boolean
  value?: React.ReactNode
}

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, lang, currency, setLang, setCurrency, logout, isAuthenticated } = useStore()
  const isRTL = lang === 'ar'
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)

  function handleLogout() {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yes'),
          style: 'destructive',
          onPress: () => {
            logout()
            navigation.navigate('Home')
          },
        },
      ]
    )
  }

  function toggleLang() {
    const newLang = lang === 'ar' ? 'en' : 'ar'
    setLang(newLang)
    setLocale(newLang)
  }

  const currencyOptions: { code: Currency; labelAr: string; labelEn: string }[] = [
    { code: 'SAR', labelAr: 'ريال سعودي', labelEn: 'Saudi Riyal' },
    { code: 'USD', labelAr: 'دولار أمريكي', labelEn: 'US Dollar' },
    { code: 'AED', labelAr: 'درهم إماراتي', labelEn: 'UAE Dirham' },
    { code: 'EGP', labelAr: 'جنيه مصري', labelEn: 'Egyptian Pound' },
  ]

  function chooseCurrency(code: Currency) {
    setCurrency(code)
    setCurrencyPickerOpen(false)
  }

  const menuItems: MenuItem[] = [
    ...(isAuthenticated ? [
      { icon: '👤', label: lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile', onPress: () => {} },
      { icon: '📦', label: t('myOrders'), onPress: () => navigation.navigate('Orders') },
      { icon: '📍', label: t('myAddresses'), onPress: () => {} },
      { icon: '🔔', label: t('notifications'), onPress: () => {} },
    ] : []),
    {
      icon: '🌐',
      label: t('language'),
      onPress: toggleLang,
      value: <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold }}>{lang === 'ar' ? 'العربية' : 'English'}</Text>,
    },
    {
      icon: '💱',
      label: t('currency'),
      onPress: () => setCurrencyPickerOpen(true),
      value: <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold }}>{currency}</Text>,
    },
    ...(isAuthenticated ? [
      { icon: '🚪', label: t('logout'), onPress: handleLogout, danger: true },
    ] : []),
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.lg, alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        {isAuthenticated ? (
          <>
            <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg }}>{user?.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, marginTop: 4 }}>{user?.email}</Text>
          </>
        ) : (
          <>
            <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg }}>
              {lang === 'ar' ? 'زائر' : 'Guest'}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Button label={t('login')} onPress={() => navigation.navigate('Auth', { screen: 'Login' })} variant="outline" style={{ borderColor: colors.white }} />
              <Button label={t('register')} onPress={() => navigation.navigate('Auth', { screen: 'Register' })} style={{ backgroundColor: colors.white }} />
            </View>
          </>
        )}
      </View>

      {/* Menu */}
      <View style={{ padding: spacing.md, paddingTop: spacing.lg }}>
        <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                padding: spacing.md,
                gap: spacing.md,
                borderBottomWidth: i < menuItems.length - 1 ? 1 : 0,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              <Text style={{ flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: item.danger ? colors.error : colors.text, textAlign: isRTL ? 'right' : 'left' }}>
                {item.label}
              </Text>
              {item.value ?? (
                <Text style={{ color: colors.textSecondary, fontSize: 18 }}>{isRTL ? '‹' : '›'}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xl, fontFamily: typography.fontFamily.regular }}>
          مورد v1.0.0 — {lang === 'ar' ? 'منصة البيع بالجملة' : 'Wholesale Platform'}
        </Text>
      </View>

      {/* Currency selector */}
      <Modal
        visible={currencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyPickerOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setCurrencyPickerOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg }}
        >
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.text, textAlign: 'center', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border }}>
              {lang === 'ar' ? 'اختر العملة' : 'Select currency'}
            </Text>
            {currencyOptions.map((opt, i) => {
              const selected = opt.code === currency
              return (
                <TouchableOpacity
                  key={opt.code}
                  onPress={() => chooseCurrency(opt.code)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    gap: spacing.md,
                    borderBottomWidth: i < currencyOptions.length - 1 ? 1 : 0,
                    borderColor: colors.border,
                    backgroundColor: selected ? colors.primaryLight : undefined,
                  }}
                >
                  <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>
                    {opt.code} — {lang === 'ar' ? opt.labelAr : opt.labelEn}
                  </Text>
                  {selected && <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold, fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              )
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}
