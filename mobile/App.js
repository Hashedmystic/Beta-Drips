import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import useMobileAuth from './lib/useMobileAuth';
import useMobileOrders from './lib/useMobileOrders';
import CheckoutScreen from './components/CheckoutScreen';
import useMobileCart from './lib/useMobileCart';
import CartScreen from './components/CartScreen';
import { previewNotice } from './lib/catalogue.mjs';
import AccountScreen from './components/AccountScreen';
import ShopScreen from './components/ShopScreen';
import ProductDetails from './components/ProductDetails';

export default function App() {
  // Authentication stays mounted while navigating; browsing does not need a session.
  const auth = useMobileAuth();
  const cart = useMobileCart(auth);
  const orders = useMobileOrders(auth, cart);
  const [checkout, setCheckout] = useState(false);
  useEffect(() => { setCheckout(false); }, [auth.session?.user.id]);
  const [tab, setTab] = useState('Shop');
  const [product, setProduct] = useState(null);
  const [filters, setFilters] = useState({ category: 'all', brandId: 'all', query: '' });
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (checkout) { setCheckout(false); return true; }
      if (product && tab === 'Shop') { setProduct(null); return true; }
      if (tab !== 'Shop') { setTab('Shop'); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [product, tab, checkout]);
  return <SafeAreaProvider><SafeAreaView style={styles.screen}>
    <StatusBar style="dark" />
    <View style={styles.header}><Image source={require('./assets/brand-mark.png')} style={styles.mark} accessible={false} /><Text style={styles.name}>Beta Drips</Text></View>
    {tab !== 'Account' && <Text style={styles.notice}>{previewNotice}</Text>}
    <View style={styles.body}>{tab === 'Account' ? <AccountScreen auth={auth} orders={orders} /> : tab === 'Cart' ? checkout ? <CheckoutScreen key={auth.session?.user.id || 'guest'} auth={auth} cart={cart} orders={orders} onBack={() => setCheckout(false)} onAccount={() => { setCheckout(false); setTab('Account'); orders.refreshHistory(); }} /> : <CartScreen cart={cart} signedIn={Boolean(auth.session)} onAccount={() => setTab('Account')} onCheckout={() => setCheckout(true)} /> : product ? <ProductDetails key={product.id} product={product} cart={cart} onBack={() => setProduct(null)} /> : <ShopScreen filters={filters} setFilters={setFilters} onOpenProduct={setProduct} />}</View>
    <View style={styles.navigation}>{['Shop', 'Cart', 'Account'].map(name => <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected: tab === name }} onPress={() => { setTab(name); setCheckout(false); if (name === 'Shop') setProduct(null); }} style={[styles.tab, tab === name && styles.activeTab]}><Text style={[styles.tabText, tab === name && styles.activeText]}>{name}</Text></Pressable>)}</View>
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#faf8f5' }, body: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }, mark: { width: 44, height: 44, borderRadius: 10 }, name: { color: '#294c37', fontSize: 22, fontWeight: '700' }, notice: { color: '#666e61', fontSize: 11, lineHeight: 16, paddingHorizontal: 20, paddingBottom: 8 }, navigation: { flexDirection: 'row', gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: '#deded5', backgroundColor: '#faf8f5' }, tab: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12 }, activeTab: { backgroundColor: '#294c37' }, tabText: { color: '#294c37', fontSize: 15, fontWeight: '600' }, activeText: { color: '#fff' },
});
