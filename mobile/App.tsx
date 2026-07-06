import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator, I18nManager } from 'react-native'
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'

import AppNavigator from './src/navigation'
import { useStore } from './src/store'
import { setLocale } from './src/i18n'
import { colors } from './src/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AppContent() {
  const { setUser, setLang, setCurrency } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function restore() {
      try {
        const [token, userJson, lang, currency] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_user'),
          AsyncStorage.getItem('app_lang'),
          AsyncStorage.getItem('app_currency'),
        ])
        if (token && userJson) setUser(JSON.parse(userJson), token)
        const resolvedLang = (lang as 'ar' | 'en' | null) ?? 'ar'
        setLang(resolvedLang)
        setLocale(resolvedLang)
        if (currency) setCurrency(currency as any)
        if (resolvedLang === 'ar' && !I18nManager.isRTL) I18nManager.forceRTL(true)
      } catch {
        // ignore restore errors
      } finally {
        setReady(true)
        SplashScreen.hideAsync().catch(() => {})
      }
    }
    restore()
  }, [])

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    )
  }

  return <AppNavigator />
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
