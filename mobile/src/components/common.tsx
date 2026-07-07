import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { colors, spacing, radius, typography, shadow } from '../theme'
import { useStore } from '../store'

// ── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: BtnVariant
  size?: BtnSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
}: ButtonProps) {
  const bgMap: Record<BtnVariant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: colors.transparent,
    ghost: colors.transparent,
    danger: colors.error,
  }
  const textMap: Record<BtnVariant, string> = {
    primary: colors.white,
    secondary: colors.white,
    outline: colors.primary,
    ghost: colors.textSecondary,
    danger: colors.white,
  }
  const sizeMap: Record<BtnSize, { height: number; fontSize: number; px: number }> = {
    sm: { height: 36, fontSize: typography.size.sm, px: spacing.md },
    md: { height: 48, fontSize: typography.size.base, px: spacing.lg },
    lg: { height: 56, fontSize: typography.size.md, px: spacing.xl },
  }
  const s = sizeMap[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: disabled ? colors.border : bgMap[variant],
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? colors.primary : undefined,
          alignSelf: fullWidth ? undefined : 'flex-start',
          width: fullWidth ? '100%' : undefined,
        },
        shadow.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} size="small" />
      ) : (
        <Text
          style={{
            color: disabled ? colors.textMuted : textMap[variant],
            fontSize: s.fontSize,
            fontFamily: typography.fontFamily.semiBold,
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: ViewStyle
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: colors.warningLight, text: colors.warning },
  confirmed:  { bg: colors.infoLight,   text: colors.info },
  processing: { bg: colors.infoLight,   text: colors.info },
  shipped:    { bg: colors.primaryLight, text: colors.primary },
  delivered:  { bg: colors.successLight, text: colors.success },
  completed:  { bg: colors.successLight, text: colors.success },
  cancelled:  { bg: colors.errorLight,  text: colors.error },
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const c = statusColors[status] ?? { bg: colors.border, text: colors.textSecondary }
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: c.text, fontSize: typography.size.xs, fontFamily: typography.fontFamily.semiBold }}>{label}</Text>
    </View>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl }}>
      <Text style={{ fontSize: 56 }}>📦</Text>
      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.text, marginTop: spacing.md, textAlign: 'center' }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>{subtitle}</Text>
      )}
    </View>
  )
}

// ── Loading ───────────────────────────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

// ── Product Card ──────────────────────────────────────────────────────────────
interface ProductCardProps {
  id: string
  name: string
  nameAr: string
  price: number
  imageUrl?: string | null
  unit?: string
  onPress: () => void
  onAddToCart?: () => void
}

export function ProductCard({ name, nameAr, price, imageUrl, unit, onPress, onAddToCart }: ProductCardProps) {
  const { lang, currency } = useStore()
  const displayName = lang === 'ar' ? (nameAr || name) : name
  const { formatPrice } = require('../utils/format')

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          width: '48%',
        },
        shadow.sm,
      ]}
    >
      <View style={{ height: 150, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' } as ImageStyle} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 40 }}>📦</Text>
        )}
      </View>
      <View style={{ padding: spacing.sm }}>
        <Text
          numberOfLines={2}
          style={{
            fontFamily: typography.fontFamily.semiBold,
            fontSize: typography.size.sm,
            color: colors.text,
            textAlign: lang === 'ar' ? 'right' : 'left',
          }}
        >
          {displayName}
        </Text>
        <View style={{ flexDirection: lang === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.primary }}>
            {formatPrice(price, currency, lang)}
          </Text>
          {unit && (
            <Text style={{ fontSize: typography.size.xs, color: colors.textSecondary }}>/{unit}</Text>
          )}
        </View>
        {onAddToCart && (
          <TouchableOpacity
            onPress={onAddToCart}
            style={{
              marginTop: spacing.sm,
              backgroundColor: colors.primaryLight,
              borderRadius: radius.sm,
              paddingVertical: 6,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.size.xs }}>
              {lang === 'ar' ? '+ أضف للسلة' : '+ Add to Cart'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}
