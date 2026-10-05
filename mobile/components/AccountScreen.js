import { ActivityIndicator, Pressable, StyleSheet, Text, ScrollView, View } from 'react-native';

export default function AccountScreen({ auth }) {
  const busy = ['restoring', 'openingBrowser', 'browser', 'exchanging', 'signingOut'].includes(auth.status);
  const loadingLabel = { restoring: 'Restoring your sign-in…', openingBrowser: 'Opening Google sign-in…', browser: 'Waiting for Google sign-in…', exchanging: 'Completing sign-in…', signingOut: 'Signing out…' }[auth.status];
  return (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.welcome} accessibilityRole="header">Your Beta Drips account</Text>
          <Text style={styles.description}>Sign in with the same account you use on the website.</Text>
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

  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
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
