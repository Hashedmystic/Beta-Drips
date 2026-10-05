import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import useMobileAuth from './lib/useMobileAuth';

export default function App() {
  const auth = useMobileAuth();
  const busy = ['restoring', 'openingBrowser', 'browser', 'exchanging', 'signingOut'].includes(auth.status);
  const loadingLabel = { restoring: 'Restoring your sign-in…', openingBrowser: 'Opening Google sign-in…', browser: 'Waiting for Google sign-in…', exchanging: 'Completing sign-in…', signingOut: 'Signing out…' }[auth.status];
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.brandMark} accessible={false}>
            <Text style={styles.initials}>BD</Text>
          </View>
          <Text style={styles.name} accessibilityRole="header">Beta Drips</Text>
          <Text style={styles.tagline}>Exceptional fashion. Nigerian brands.</Text>
          <View style={styles.divider} />
          <Text style={styles.welcome}>Welcome to Beta Drips</Text>
          <Text style={styles.description}>A home for Nigerian style.</Text>
          <View style={styles.account}>
            {auth.session ? <>
              <Text style={styles.welcome} accessibilityRole="header">Your account</Text>
              <Text style={styles.description}>{auth.session.user.user_metadata?.full_name || 'Signed in'}</Text>
              <Text style={styles.email} selectable>{auth.session.user.email || 'Google account'}</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={auth.signOut} style={[styles.button, busy && styles.disabled]}>
                <Text style={styles.buttonText}>Sign out of this app</Text>
              </Pressable>
            </> : auth.status === 'unconfigured' ? <Text style={styles.description}>Sign-in is not configured for this build.</Text> : <Pressable accessibilityRole="button" disabled={busy} onPress={auth.signIn} style={[styles.button, busy && styles.disabled]}>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </Pressable>}
            {busy && <View style={styles.loading}><ActivityIndicator color="#294c37" /><Text style={styles.description}>{loadingLabel}</Text></View>}
            {Boolean(auth.message) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.message}>{auth.message}</Text>}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#faf8f5' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  brandMark: { width: 88, height: 88, borderRadius: 24, backgroundColor: '#294c37', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  initials: { color: '#faf8f5', fontSize: 30, fontWeight: '700' },
  name: { color: '#242424', fontSize: 42, fontWeight: '700', textAlign: 'center' },
  tagline: { color: '#294c37', fontSize: 19, lineHeight: 28, textAlign: 'center', marginTop: 12, maxWidth: 320 },
  divider: { height: 1, width: 56, backgroundColor: '#ded9d1', marginVertical: 32 },
  welcome: { color: '#242424', fontSize: 20, fontWeight: '600', textAlign: 'center' },
  description: { color: '#555', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 8 },
  account: { alignSelf: 'stretch', alignItems: 'center', marginTop: 28 },
  email: { color: '#555', fontSize: 16, textAlign: 'center', marginTop: 8 },
  button: { backgroundColor: '#294c37', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 16, marginTop: 16, minHeight: 48 },
  buttonText: { color: '#faf8f5', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.55 },
  loading: { alignItems: 'center', marginTop: 16 },
  message: { color: '#555', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 16 },
});
