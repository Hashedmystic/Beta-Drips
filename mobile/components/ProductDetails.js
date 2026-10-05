import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../lib/catalogue.mjs';
import ProductImage from './ProductImage';

export default function ProductDetails({ product, onBack }) {
  const [linkError, setLinkError] = useState(false);
  const open = async url => { try { await Linking.openURL(url); setLinkError(false); } catch { setLinkError(true); } };
  return <ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><Text style={styles.link}>← Back to Shop</Text></Pressable>
    <ProductImage product={product} style={styles.image} />
    <Text style={styles.brand}>{product.brand} · {product.category}</Text>
    <Text accessibilityRole="header" style={styles.name}>{product.name}</Text>
    <Text style={styles.price}>{formatPrice(product.price)}</Text>
    <Text style={styles.description}>{product.description}</Text>
    <Text accessibilityRole="header" style={styles.sizeHeading}>Available sizes · {product.sizeLabel}</Text>
    <View style={styles.sizes}>{product.sizes.map(size => <View key={size} style={styles.size}><Text style={styles.sizeText}>{size}</Text></View>)}</View>
    <View style={styles.credit}><Text style={styles.creditText}>Image: {product.photo.photographer}</Text>
      <Pressable accessibilityRole="link" onPress={() => open(product.photo.source)} style={styles.creditLink}><Text style={styles.link}>View image source</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => open(product.photo.licenseUrl)} style={styles.creditLink}><Text style={styles.link}>{product.photo.license}</Text></Pressable>
      <Text style={styles.creditText}>{product.photo.changes}</Text>
      {linkError && <Text accessibilityRole="alert" style={styles.creditText}>Could not open the link. Please try again.</Text>}
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 }, back: { paddingVertical: 12, marginBottom: 8 }, link: { color: '#294c37', fontWeight: '600' }, image: { height: 380, borderRadius: 20 }, brand: { color: '#687066', fontSize: 13, marginTop: 22 }, name: { color: '#242b25', fontSize: 28, lineHeight: 35, fontWeight: '700', marginTop: 8 }, price: { color: '#294c37', fontSize: 24, fontWeight: '700', marginTop: 14 }, description: { color: '#555e54', fontSize: 16, lineHeight: 25, marginTop: 18 }, sizeHeading: { color: '#242b25', fontWeight: '600', fontSize: 15, marginTop: 24 }, sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, size: { borderWidth: 1, borderColor: '#d9ddd4', borderRadius: 10, padding: 12 }, sizeText: { color: '#294c37' }, credit: { borderTopWidth: 1, borderTopColor: '#deded5', marginTop: 28, paddingTop: 16 }, creditText: { color: '#687066', fontSize: 12, lineHeight: 19 }, creditLink: { paddingVertical: 10 },
});
