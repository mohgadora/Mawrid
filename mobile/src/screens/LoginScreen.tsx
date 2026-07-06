import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native'
import { colors, spacing, radius, typography } from '../theme'
import { Button } from '../components/common'
import { useStore } from '../store'
import { loginApi } from '../api'
import { t } from '../i18n'

interface Props {
  navigation: any
}

export default function LoginScreen({ navigation }: Props) {
  const { setUser, lang } = useStore()
  const isRTL = lang === 'ar'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('', t('required'))
      return
    }
    setLoading(true)
    try {
      const res = await loginApi(email.trim(), password)
      const user = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone,
        role: res.user.role ?? 'consumer',
      }
      setUser(user, res.token ?? res.session?.token ?? null)
    } catch {
      Alert.alert('', t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingTop: 80, paddingBottom: 50, paddingHorizontal: spacing.xl, alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>🛒</Text>
          <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.xxl, marginTop: spacing.sm }}>مورد</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, marginTop: 4 }}>
            {lang === 'ar' ? 'منصة البيع بالجملة' : 'Wholesale Platform'}
          </Text>
        </View>

        <View style={{ flex: 1, padding: spacing.xl, marginTop: -20, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.text, textAlign: isRTL ? 'right' : 'left', marginBottom: spacing.lg }}>
            {t('login')}
          </Text>

          <View style={{ gap: spacing.md }}>
            <View>
              <Text style={[s.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('email')}</Text>
              <TextInput
                style={[s.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="example@company.com"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View>
              <Text style={[s.label, { textAlign: isRTL ? 'right' : 'left' }]}>{t('password')}</Text>
              <TextInput
                style={[s.input, { textAlign: isRTL ? 'right' : 'left' }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end' }}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm }}>
                {t('forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button label={t('loginBtn')} onPress={handleLogin} loading={loading} fullWidth size="lg" />
          </View>

          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', marginTop: spacing.xl, gap: 4 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.regular }}>{t('noAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold }}>{t('register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.base,
    color: colors.text,
  },
})
