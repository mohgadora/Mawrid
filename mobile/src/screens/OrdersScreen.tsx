import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { colors, spacing, radius, typography } from '../theme'
import { useStore } from '../store'
import { StatusBadge, EmptyState } from '../components/common'
import { getOrders } from '../api'
import { t } from '../i18n'
import { formatPrice, formatDate } from '../utils/format'

const statusTranslations: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغى',
}

export default function OrdersScreen({ navigation }: { navigation: any }) {
  const { lang, currency, isAuthenticated } = useStore()
  const isRTL = lang === 'ar'
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    if (!isAuthenticated) { setLoading(false); return }
    try {
      const data = await getOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch { setOrders([]) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('myOrders')} isRTL={isRTL} />
        <EmptyState
          title={lang === 'ar' ? 'يجب تسجيل الدخول' : 'Sign in required'}
          subtitle={lang === 'ar' ? 'سجّل دخولك لرؤية طلباتك' : 'Sign in to view your orders'}
        />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t('myOrders')} isRTL={isRTL} />

      {orders.length === 0 ? (
        <EmptyState title={t('noOrders')} subtitle={t('noOrdersSub')} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={colors.primary} />}
          renderItem={({ item: order }) => {
            const statusLabel = lang === 'ar' ? (statusTranslations[order.status] ?? order.status) : t(order.status)
            const total = order.total ?? order.lines?.reduce((s: number, l: any) => s + (l.unitPrice ?? 0) * (l.qty ?? 1), 0) ?? 0
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.sm, color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>
                      {t('orderNumber')} #{order.id?.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                      {formatDate(order.createdAt ?? order.date ?? new Date().toISOString(), lang)}
                    </Text>
                  </View>
                  <StatusBadge status={order.status} label={statusLabel} />
                </View>

                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.textSecondary }}>
                    {order.lines?.length ?? 1} {lang === 'ar' ? 'منتج' : 'items'}
                  </Text>
                  <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.primary }}>
                    {formatPrice(total, currency, lang)}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
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
