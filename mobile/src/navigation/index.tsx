import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { useStore } from '../store'
import { colors, typography, spacing } from '../theme'

import HomeScreen from '../screens/HomeScreen'
import ProductsScreen from '../screens/ProductsScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import CartScreen from '../screens/CartScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import OrdersScreen from '../screens/OrdersScreen'
import ProfileScreen from '../screens/ProfileScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import { t } from '../i18n'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    </View>
  )
}

function MainTabs() {
  const { cart, lang } = useStore()
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const isRTL = lang === 'ar'

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.size.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          title: t('products'),
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('cart'),
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} />,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: colors.white, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: t('orders'),
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile'),
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

// Web deep-linking: map URL paths to screens so direct URLs (e.g. /ProductDetail) resolve.
const linking: any = {
  prefixes: [],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'Home',
          Products: 'Products',
          Cart: 'Cart',
          Orders: 'Orders',
          Profile: 'Profile',
        },
      },
      ProductDetail: 'ProductDetail/:productId?',
      Checkout: 'Checkout',
      OrderDetail: 'OrderDetail/:orderId?',
      Auth: 'Auth',
      Search: 'Search',
    },
  },
}

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="OrderDetail" component={OrdersScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Auth" component={AuthStack} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Search" component={ProductsScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
