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
import { registerApi } from '../api'
import { t } from '../i18n'

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const { setUser, lang } = useStore()
  const isRTL = lang === 'ar'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert('', t('required'))
      return
    }
    setLoading(true)
    try {
      const res = await registerApi(form)
      const user = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        phone: form.phone,
        role: 'consumer',
      }
      setUser(user, res.token ?? res.session?.token ?? null)
    } catch {
      Alert.alert('', lang === 'ar' ? 'حدث خطأ في إنشاء الحساب' : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: t('name'), keyboard: 'default' as const, secure: false },
    { key: 'email', label: t('email'), keyboard: 'email-address' as const, secure: false },
    { key: 'password', label: t('password'), keyboard: 'default' as const, secure: true },
    { key: 'phone', label: t('phone'), keyboard: 'phone-pad' as const, secure: false },
  ]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.white, fontSize: 24 }}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.white, fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl }}>{t('register')}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, marginTop: 4 }}>
            {lang === 'ar' ? 'أنشئ حسابك في مورد' : 'Create your Mawrid account'}
          </Text>
        </View>

        <View style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}>
          <View style={{ gap: spacing.md }}>
            {fields.map((f) => (
              <View key={f.key}>
                <Text style={[s.label, { textAlign: isRTL ? 'right' : 'left' }]}>{f.label}</Text>
                <TextInput
                  style={[s.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  value={form[f.key as keyof typeof form]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard}
                  secureTextEntry={f.secure}
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}

            <Button label={t('registerBtn')} onPress={handleRegister} loading={loading} fullWidth size="lg" />
          </View>

          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', marginTop: spacing.xl, gap: 4 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.regular }}>{t('haveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.semiBold }}>{t('login')}</Text>
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
