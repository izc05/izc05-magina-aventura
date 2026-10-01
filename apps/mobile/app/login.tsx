import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../src/theme/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { returnTo, slug: returnSlug } = useLocalSearchParams<{
    returnTo?: string | string[];
    slug?: string | string[];
  }>();

  function finishAuthentication() {
    const target = Array.isArray(returnTo) ? returnTo[0] : returnTo;
    const slug = Array.isArray(returnSlug) ? returnSlug[0] : returnSlug;
    if (target === 'passport') {
      router.replace('/profile');
    } else if (target === 'bedmar-gallery') {
      router.replace({
        pathname: '/municipal-routes/[slug]',
        params: { slug: 'sendero-fluvial-cueva-del-agua' },
      });
    } else if ((target === 'adventure' || target === 'summary') && slug && /^[a-z0-9-]{1,80}$/.test(slug)) {
      router.replace(target === 'summary'
        ? { pathname: '/adventure/[slug]/summary', params: { slug } }
        : { pathname: '/adventure/[slug]', params: { slug } });
    } else {
      router.replace('/');
    }
  }

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Error', error.message);
    else finishAuthentication();
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert('Error', error.message);
    else if (!session) Alert.alert('Revisa tu correo para verificar tu cuenta');
    else finishAuthentication();

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Mágina Aventura</Text>
        <Text style={styles.subtitle}>Inicia sesión para guardar tu pasaporte</Text>
        <Text style={styles.explorationNote}>
          Las rutas públicas se pueden explorar sin cuenta. Inicia sesión o regístrate cuando quieras guardar tu pasaporte o tus datos personales.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            accessibilityLabel="Correo electrónico"
            style={styles.input}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            accessibilityLabel="Contraseña"
            style={styles.input}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry
            placeholder="Contraseña"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            style={styles.buttonPrimary}
            onPress={() => { void signInWithEmail(); }}
          >
            <Text style={styles.buttonPrimaryText}>Iniciar Sesión</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            style={styles.buttonSecondary}
            onPress={() => { void signUpWithEmail(); }}
          >
            <Text style={styles.buttonSecondaryText}>Registrarse</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explorar sin cuenta"
            accessibilityHint="Abre Home y permite consultar las fichas públicas sin iniciar sesión ni crear una cuenta."
            style={styles.buttonGuest}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonGuestText}>Explorar sin cuenta</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[20],
    backgroundColor: colors.warmBackground,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[32],
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.olive900,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    marginTop: spacing[8],
  },
  explorationNote: {
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
    textAlign: 'center',
    marginTop: spacing[16],
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing[16],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[16],
    borderRadius: radius.md,
    fontSize: 16,
  },
  actions: {
    marginTop: spacing[24],
    gap: spacing[12],
  },
  buttonPrimary: {
    backgroundColor: colors.olive900,
    padding: spacing[16],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    padding: spacing[16],
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.olive900,
  },
  buttonSecondaryText: {
    color: colors.olive900,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonGuest: {
    minHeight: 48,
    padding: spacing[16],
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.limestone,
  },
  buttonGuestText: {
    color: colors.olive900,
    fontSize: 16,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
