import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { validateCheckout } from '../../src/lib/checkout.js';
import { cartLines, cartTotal } from '../../src/data/cartModel.js';
import { formatPrice } from '../lib/catalogue.mjs';
import { DEMO_NOTICE } from '../lib/orderApi.mjs';
import { SavedOrder } from './OrderHistory';

const fields = [
  { key: 'name', label: 'Full name', maxLength: 100, autoComplete: 'name' },
  { key: 'email', label: 'Email', maxLength: 254, keyboardType: 'email-address', autoComplete: 'email', autoCapitalize: 'none' },
  { key: 'phone', label: 'Phone', maxLength: 30, keyboardType: 'phone-pad', autoComplete: 'tel' },
  { key: 'address', label: 'Delivery address', maxLength: 500, multiline: true, autoComplete: 'street-address' },
];
export default function CheckoutScreen({ cart, orders, auth, onBack, onAccount }) {
  const [details, setDetails] = useState({ name: '', email: auth.session?.user.email || '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const frozen = orders.attempt;
  const delivery = frozen?.delivery || details;
  const items = frozen?.items || cart.items;
  const saving = orders.status === 'submitting';
  const canSubmit = Boolean(auth.session) && (['pending', 'retry'].includes(orders.status) || (orders.status === 'ready' && cart.status === 'ready' && !cart.busy && !cart.checkoutPending && items.length > 0));
  async function submit() {
    const next = validateCheckout(delivery); setErrors(next);
    if (!Object.keys(next).length) await orders.submit(delivery);
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.action}><Text style={styles.link}>← Back to cart</Text></Pressable>
    <Text accessibilityRole="header" style={styles.heading}>Demo checkout</Text><Text style={styles.demo}>{DEMO_NOTICE}</Text>
    {orders.status === 'success' && orders.result ? <View>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.success}>Your demo order is saved.</Text>
      <SavedOrder order={orders.result.order} emailStatus={orders.result.emailStatus} />
      <Pressable accessibilityRole="button" onPress={onAccount} style={styles.button}><Text style={styles.buttonText}>View order history</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={async () => { if (await orders.startAnother()) onBack(); }} style={styles.action}><Text style={styles.link}>Done — return to cart</Text></Pressable>
    </View> : <View>
      {!auth.session ? <><Text style={styles.description}>Sign in with your account to check out and view saved orders.</Text><Pressable accessibilityRole="button" onPress={onAccount} style={styles.action}><Text style={styles.link}>Go to Account</Text></Pressable></> : <>
        <Text style={styles.description}>Required contact details are saved with this demo order. No payment or delivery fee is collected.</Text>
        {frozen && <Text style={styles.description}>This submission is awaiting confirmation. Its original details are locked so retrying cannot create a different order.</Text>}
        {fields.map(({ key, label, ...props }) => <View key={key} style={styles.field}><Text style={styles.label}>{label} (required)</Text><TextInput {...props} accessibilityLabel={`${label}, required`} editable={!frozen && !saving && orders.status === 'ready'} value={delivery[key]} onChangeText={value => { setDetails(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); }} style={[styles.input, key === 'address' && styles.address, errors[key] && styles.invalid]} />{errors[key] && <Text accessibilityRole="alert" style={styles.error}>{errors[key]}</Text>}</View>)}
        <Text accessibilityRole="header" style={styles.summaryHeading}>Order summary</Text>
        {cartLines(items).map(item => <View key={JSON.stringify([item.productId, item.size])} style={styles.line}><Text style={styles.label}>{item.product.name}</Text><Text style={styles.description}>{item.size} × {item.quantity} · {formatPrice(item.product.price * item.quantity)}</Text></View>)}
        {items.length > 0 && <Text style={styles.total}>{formatPrice(cartTotal(items))}</Text>}
        {!items.length && orders.status === 'ready' && <Text style={styles.description}>{cart.status === 'ready' ? 'Your cart is empty. Add a piece before checking out.' : 'Your cart could not be loaded. Return to Cart and refresh.'}</Text>}
        <Pressable accessibilityRole="button" disabled={!canSubmit || saving} onPress={submit} style={[styles.button, (!canSubmit || saving) && styles.disabled]}><Text style={styles.buttonText}>{saving ? 'Saving demo order…' : frozen ? 'Retry this demo order' : 'Place demo order'}</Text></Pressable>
      </>}
      {(saving || orders.status === 'loading') && <ActivityIndicator color="#294c37" style={styles.spinner} accessibilityLabel="Loading checkout" />}
    </View>}
    {Boolean(orders.error) && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{orders.error}</Text>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 }, action: { paddingVertical: 14 }, link: { color: '#294c37', fontWeight: '600' }, heading: { color: '#242b25', fontSize: 29, fontWeight: '700' }, demo: { color: '#294c37', fontSize: 15, fontWeight: '600', marginVertical: 12 }, description: { color: '#687066', fontSize: 14, lineHeight: 22, marginTop: 8 }, field: { marginTop: 18 }, label: { color: '#242b25', fontSize: 14, fontWeight: '600' }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9ddd4', borderRadius: 12, padding: 14, fontSize: 16, color: '#242b25', marginTop: 8 }, address: { minHeight: 110, textAlignVertical: 'top' }, invalid: { borderColor: '#8b3f25' }, error: { color: '#8b3f25', fontSize: 14, lineHeight: 23, marginTop: 12 }, summaryHeading: { color: '#242b25', fontSize: 22, fontWeight: '700', marginTop: 28 }, line: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#deded5' }, total: { color: '#294c37', fontSize: 24, fontWeight: '700', marginTop: 18 }, button: { backgroundColor: '#294c37', borderRadius: 12, padding: 16, marginTop: 24 }, buttonText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 15 }, disabled: { opacity: 0.45 }, spinner: { marginTop: 16 }, success: { color: '#294c37', fontSize: 23, fontWeight: '700', marginVertical: 16 },
});
