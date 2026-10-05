import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { productImageUrl } from '../lib/catalogue.mjs';

export default function ProductImage({ product, style }) {
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  return <View style={[styles.frame, style]}>
    <Image key={`${product.id}-${attempt}`} source={{ uri: productImageUrl(product) }}
      accessibilityLabel={product.imageAlt} resizeMode="contain" style={StyleSheet.absoluteFill}
      onLoadStart={() => setStatus('loading')} onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
    {status === 'loading' && <View style={styles.placeholder}><ActivityIndicator color="#294c37" /><Text style={styles.label}>Loading image…</Text></View>}
    {status === 'error' && <View style={styles.placeholder}><Text style={styles.label}>Image unavailable</Text><Pressable accessibilityRole="button" accessibilityLabel={`Retry image for ${product.name}`} onPress={() => { setStatus('loading'); setAttempt(value => value + 1); }} style={styles.retry}><Text style={styles.retryText}>Retry image</Text></Pressable></View>}
  </View>;
}
const styles = StyleSheet.create({
  frame: { backgroundColor: '#efede7', overflow: 'hidden' },
  placeholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#efede7', alignItems: 'center', justifyContent: 'center', padding: 8 },
  label: { color: '#555', textAlign: 'center', marginTop: 8, fontSize: 12 },
  retry: { padding: 12 }, retryText: { color: '#294c37', fontWeight: '600' },
});
