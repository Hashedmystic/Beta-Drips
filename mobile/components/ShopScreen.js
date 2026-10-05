import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { brands, categories, formatPrice, searchProducts } from '../lib/catalogue.mjs';
import ProductImage from './ProductImage';

function Filters({ label, options, selected, onChange }) {
  return <View style={styles.filter}><Text style={styles.filterLabel}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
    {options.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: selected === option.id }} onPress={() => onChange(option.id)} style={[styles.chip, selected === option.id && styles.selectedChip]}><Text style={[styles.chipText, selected === option.id && styles.selectedText]}>{option.name}</Text></Pressable>)}
  </ScrollView></View>;
}
export default function ShopScreen({ filters, setFilters, onOpenProduct }) {
  const { width } = useWindowDimensions();
  const items = searchProducts(filters);
  const active = filters.category !== 'all' || filters.brandId !== 'all' || Boolean(filters.query);
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const reset = () => setFilters({ category: 'all', brandId: 'all', query: '' });
  return <FlatList data={items} numColumns={2} keyExtractor={product => product.id} keyboardShouldPersistTaps="handled"
    contentContainerStyle={styles.list} columnWrapperStyle={styles.row}
    ListHeaderComponent={<View>
      <Text style={styles.heading} accessibilityRole="header">Find your next favourite.</Text><Text style={styles.intro}>Exceptional fashion. Nigerian brands.</Text>
      <View style={styles.search}><TextInput accessibilityLabel="Search the catalogue" placeholder="Search clothing or brands" placeholderTextColor="#6e736e" value={filters.query} onChangeText={value => update('query', value)} style={styles.input} returnKeyType="search" />{Boolean(filters.query) && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => update('query', '')} style={styles.clearSearch}><Text style={styles.link}>Clear</Text></Pressable>}</View>
      <Filters label="Category" selected={filters.category} onChange={value => update('category', value)} options={[{ id: 'all', name: 'All categories' }, ...categories.map(category => ({ id: category, name: category }))]} />
      <Filters label="Brand" selected={filters.brandId} onChange={value => update('brandId', value)} options={[{ id: 'all', name: 'All brands' }, ...brands]} />
      <View style={styles.results}><Text style={styles.resultText} accessibilityLiveRegion="polite">{items.length} {items.length === 1 ? 'piece' : 'pieces'}</Text>{active && <Pressable accessibilityRole="button" onPress={reset} style={styles.reset}><Text style={styles.link}>Clear filters</Text></Pressable>}</View>
    </View>}
    ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No matching pieces</Text><Text style={styles.intro}>Try another search, brand or category.</Text><Pressable accessibilityRole="button" onPress={reset} style={styles.reset}><Text style={styles.link}>Show all clothing</Text></Pressable></View>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.brand}, ${formatPrice(item.price)}. View details`} onPress={() => onOpenProduct(item)} style={[styles.card, { width: (width - 52) / 2 }]}>
      <ProductImage product={item} style={styles.image} /><View style={styles.cardText}><Text style={styles.brand}>{item.brand}</Text><Text style={styles.productName} numberOfLines={2}>{item.name}</Text><Text style={styles.price}>{formatPrice(item.price)}</Text></View>
    </Pressable>} />;
}
const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 30 }, row: { gap: 12 }, heading: { color: '#242b25', fontSize: 29, fontWeight: '700', lineHeight: 35 },
  intro: { color: '#687066', fontSize: 14, lineHeight: 22, marginTop: 8 }, search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d9ddd4', borderRadius: 14, backgroundColor: '#fff', marginTop: 22 }, input: { flex: 1, padding: 14, color: '#242b25', fontSize: 15 }, clearSearch: { padding: 14 },
  filter: { marginTop: 16 }, filterLabel: { color: '#294c37', fontSize: 12, fontWeight: '700', marginBottom: 8 }, chips: { gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#d9ddd4', backgroundColor: '#faf8f5' }, selectedChip: { backgroundColor: '#294c37', borderColor: '#294c37' }, chipText: { color: '#49534b', fontSize: 13 }, selectedText: { color: '#fff' }, results: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 10 }, resultText: { color: '#687066', fontSize: 13 }, reset: { paddingVertical: 12 }, link: { color: '#294c37', fontWeight: '600' },
  card: { borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4e5dc', overflow: 'hidden', marginBottom: 14 }, image: { height: 190 }, cardText: { padding: 12 }, brand: { color: '#687066', fontSize: 11, marginBottom: 6 }, productName: { color: '#242b25', fontSize: 14, lineHeight: 20, fontWeight: '600', minHeight: 40 }, price: { color: '#294c37', fontSize: 15, fontWeight: '700', marginTop: 10 }, empty: { paddingVertical: 40, alignItems: 'center' }, emptyTitle: { color: '#242b25', fontSize: 21, fontWeight: '600' },
});
