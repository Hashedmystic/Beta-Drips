import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
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
});
