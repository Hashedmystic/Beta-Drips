import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../lib/catalogue.mjs';
import ProductImage from './ProductImage';

export default function ProductDetails({ product, onBack, cart }) {
  const [linkError, setLinkError] = useState(false);
  const [selectedSize, setSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => { setAdded(false); }, [cart.owner]);
  async function add() {
    setAdding(true); setAdded(false);
    try { setAdded(Boolean(await cart.add(product.id, selectedSize))); } finally { setAdding(false); }
  }
  const open = async url => { try { await Linking.openURL(url); setLinkError(false); } catch { setLinkError(true); } };
  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.link}>← Back to Shop</Text></Pressable>
    <ProductImage product={product} style={styles.image} />
    <Text style={styles.brand}>{product.brand} · {product.category}</Text>
    <Text accessibilityRole="header" style={styles.name}>{product.name}</Text>
    <Text style={styles.price}>{formatPrice(product.price)}</Text>
    <Text style={styles.description}>{product.description}</Text>
    <Text accessibilityRole="header" style={styles.sizeHeading}>Available sizes · {product.sizeLabel}</Text>
    <View style={styles.sizes}>{product.sizes.map(size => <Pressable key={size} accessibilityRole="button" accessibilityLabel={`Select size ${size}`} accessibilityState={{ selected: size === selectedSize }} onPress={() => { setSize(size); setAdded(false); }} style={[styles.size, size === selectedSize && styles.selectedSize]}><Text style={[styles.sizeText, size === selectedSize && styles.selectedSizeText]}>{size}</Text></Pressable>)}</View>
    <Text style={styles.description}>{selectedSize ? `Selected: ${selectedSize}` : 'Choose a size before adding to your cart.'}</Text>
    <Pressable accessibilityRole="button" disabled={!selectedSize || adding || cart.busy || cart.status !== 'ready'} onPress={add} style={[styles.add, (!selectedSize || adding || cart.busy || cart.status !== 'ready') && styles.disabled]}><Text style={styles.addText}>{adding ? 'Adding…' : 'Add to cart'}</Text></Pressable>
    {added && <Text accessibilityLiveRegion="polite" style={styles.description}>Added to cart.</Text>}
    {cart.status === 'loading' && <Text style={styles.description}>Loading your cart…</Text>}
    {Boolean(cart.error) && <Text accessibilityRole="alert" style={styles.description}>{cart.error} Open Cart to refresh.</Text>}
    <View style={styles.credit}><Text style={styles.creditText}>Image: {product.photo.photographer}</Text>
      <Pressable accessibilityRole="link" onPress={() => open(product.photo.source)} style={styles.creditLink}><Text style={styles.link}>View image source</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => open(product.photo.licenseUrl)} style={styles.creditLink}><Text style={styles.link}>{product.photo.license}</Text></Pressable>
      <Text style={styles.creditText}>{product.photo.changes}</Text>
      {linkError && <Text accessibilityRole="alert" style={styles.creditText}>Could not open the link. Please try again.</Text>}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  selectedSize: { backgroundColor: '#294c37', borderColor: '#294c37' }, selectedSizeText: { color: '#fff' }, add: { backgroundColor: '#294c37', borderRadius: 12, padding: 16, marginTop: 16 }, addText: { color: '#fff', fontWeight: '600', textAlign: 'center' }, disabled: { opacity: 0.45 },
  content: { padding: 20, paddingBottom: 32 }, back: { paddingVertical: 12, marginBottom: 8 }, link: { color: '#294c37', fontWeight: '600' }, image: { height: 380, borderRadius: 20 }, brand: { color: '#687066', fontSize: 13, marginTop: 22 }, name: { color: '#242b25', fontSize: 28, lineHeight: 35, fontWeight: '700', marginTop: 8 }, price: { color: '#294c37', fontSize: 24, fontWeight: '700', marginTop: 14 }, description: { color: '#555e54', fontSize: 16, lineHeight: 25, marginTop: 18 }, sizeHeading: { color: '#242b25', fontWeight: '600', fontSize: 15, marginTop: 24 }, sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, size: { borderWidth: 1, borderColor: '#d9ddd4', borderRadius: 10, padding: 12 }, sizeText: { color: '#294c37' }, credit: { borderTopWidth: 1, borderTopColor: '#deded5', marginTop: 28, paddingTop: 16 }, creditText: { color: '#687066', fontSize: 12, lineHeight: 19 }, creditLink: { paddingVertical: 10 },
});
