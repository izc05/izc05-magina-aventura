import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../src/theme/tokens';
import { CollectionCard } from '../src/components/progression/CollectionCard';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.push('/')}>
            <Text style={styles.backButtonText}>← Inicio</Text>
          </Pressable>
          <Text style={styles.title}>Pasaporte</Text>
        </View>

        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Aventurero</Text>
              <Text style={styles.userTitle}>Explorador Principiante</Text>
            </View>
          </View>
          
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelText}>Nivel 3</Text>
              <Text style={styles.xpText}>1250 / 2000 XP</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '62%' }]} />
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Rutas</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Descubrimientos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>Km recorridos</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insignias Recientes</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}><Text style={styles.badgeIcon}>⛰️</Text></View>
            <View style={styles.badge}><Text style={styles.badgeIcon}>🥾</Text></View>
            <View style={styles.badge}><Text style={styles.badgeIcon}>🦅</Text></View>
            <View style={[styles.badge, styles.badgeLocked]}><Text style={styles.badgeIcon}>?</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Colección</Text>
          <View style={styles.grid}>
            <CollectionCard emoji="🌿" name="Piorno Azul" family="Flora" collected={true} />
            <CollectionCard emoji="🏛" name="Castillo Almodóvar" family="Patrimonio" collected={true} />
            <CollectionCard emoji="🫒" name="Olivo Centenario" family="Cultura" collected={true} />
            <CollectionCard emoji="🦅" name="Águila Real" family="Fauna" collected={false} />
            <CollectionCard emoji="🍄" name="Seta de Cardo" family="Flora" collected={false} />
            <CollectionCard emoji="🏰" name="Torrejón" family="Patrimonio" collected={false} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  scrollContent: { padding: spacing[20] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[24], paddingTop: spacing[8] },
  backButton: { marginRight: spacing[16], padding: spacing[8], paddingLeft: 0 },
  backButtonText: { color: colors.olive900, fontSize: 16, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  
  passportCard: { backgroundColor: colors.olive900, borderRadius: radius.lg, padding: spacing[24], marginBottom: spacing[32], shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  passportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[24] },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center', marginRight: spacing[16], borderWidth: 2, borderColor: colors.white },
  avatarText: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: colors.white, fontSize: 20, fontWeight: '900' },
  userTitle: { color: colors.limestone, fontSize: 14, fontWeight: '700', marginTop: 2 },
  
  levelSection: { marginBottom: spacing[24] },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[8] },
  levelText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  xpText: { color: colors.aoveGold, fontSize: 14, fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.pill, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.aoveGold, borderRadius: radius.pill },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md, padding: spacing[16] },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.white, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.limestone, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  
  section: { marginBottom: spacing[32] },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginBottom: spacing[16] },
  
  badgesRow: { flexDirection: 'row', gap: spacing[12] },
  badge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  badgeLocked: { backgroundColor: colors.warmBackground, borderColor: 'transparent', opacity: 0.5 },
  badgeIcon: { fontSize: 28 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
