import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../src/theme/tokens';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
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
    else router.replace('/');
    
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>Mágina Aventura</Text>
        <Text style={styles.subtitle}>Inicia sesión para guardar tu pasaporte</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="Correo electrónico"
            autoCapitalize={'none'}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Contraseña"
            autoCapitalize={'none'}
          />
        </View>
        
        <View style={styles.actions}>
          <Pressable style={styles.buttonPrimary} disabled={loading} onPress={() => signInWithEmail()}>
            <Text style={styles.buttonPrimaryText}>Iniciar Sesión</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} disabled={loading} onPress={() => signUpWithEmail()}>
            <Text style={styles.buttonSecondaryText}>Registrarse</Text>
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
    marginBottom: spacing[40],
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
});
