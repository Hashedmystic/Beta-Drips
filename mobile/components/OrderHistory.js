import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../lib/catalogue.mjs';
import { DEMO_NOTICE } from '../lib/orderApi.mjs';
import { emailStatusText } from '../../src/lib/orderStatus.js';

export function SavedOrder({ order, emailStatus }) {
  return <View>
    <Text style={styles.reference} selectable>Order {order.id}</Text>
    <Text style={styles.date}>{new Date(order.created_at).toLocaleString('en-NG')}</Text>
    <Text style={styles.demo}>{DEMO_NOTICE}</Text>
    {order.order_items.map(item => <View key={JSON.stringify([item.product_id, item.size])} style={styles.line}><Text style={styles.name}>{item.name}</Text><Text style={styles.detail}>{item.brand} · {item.size} × {item.quantity}</Text><Text style={styles.detail}>{formatPrice(item.unit_price_naira * item.quantity)}</Text></View>)}
    <Text style={styles.total}>{formatPrice(order.total_naira)}</Text>
    <Text style={styles.detail}>{emailStatusText(emailStatus ?? order.order_emails?.status)}</Text>
  </View>;
}
export default function OrderHistory({ orders }) {
  const [expanded, setExpanded] = useState(null);
  return <View style={styles.history}>
    <Text accessibilityRole="header" style={styles.heading}>Order history</Text>
    <Pressable accessibilityRole="button" disabled={orders.historyStatus === 'loading'} onPress={orders.refreshHistory} style={styles.action}><Text style={styles.link}>Refresh orders</Text></Pressable>
    {orders.historyStatus === 'loading' && <ActivityIndicator color="#294c37" accessibilityLabel="Loading order history" />}
    {Boolean(orders.historyError) && <Text accessibilityRole="alert" style={styles.error}>{orders.historyError}</Text>}
    {orders.historyStatus === 'ready' && !orders.orders.length && <Text style={styles.detail}>No saved orders yet.</Text>}
    {orders.historyStatus === 'session-lost' && <Text style={styles.detail}>Sign in again to view your saved orders.</Text>}
    {orders.historyStatus === 'error' && orders.orders.length > 0 && <Text style={styles.detail}>Showing the last loaded orders.</Text>}
    {orders.orders.map(order => <View key={order.id} style={styles.card}>
      <Text style={styles.demo}>{DEMO_NOTICE}</Text><Text style={styles.date}>{new Date(order.created_at).toLocaleString('en-NG')}</Text><Text style={styles.total}>{formatPrice(order.total_naira)}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === order.id }} accessibilityLabel={`View details for order ${order.id}`} onPress={() => setExpanded(expanded === order.id ? null : order.id)} style={styles.action}><Text style={styles.link}>{expanded === order.id ? 'Hide details' : 'View order details'}</Text></Pressable>
      {expanded === order.id && <SavedOrder order={order} />}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  history: { alignSelf: 'stretch', marginTop: 30 }, heading: { color: '#242b25', fontWeight: '700', fontSize: 24 }, card: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#deded5', backgroundColor: '#fff', marginTop: 14 }, reference: { color: '#294c37', fontSize: 12, lineHeight: 20 }, date: { color: '#687066', fontSize: 12, marginTop: 8 }, demo: { color: '#294c37', fontWeight: '600', fontSize: 14, marginTop: 8 }, line: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#deded5' }, name: { color: '#242b25', fontWeight: '600', fontSize: 15 }, detail: { color: '#687066', fontSize: 13, lineHeight: 21, marginTop: 6 }, total: { color: '#294c37', fontSize: 21, fontWeight: '700', marginVertical: 12 }, action: { paddingVertical: 14, alignSelf: 'flex-start' }, link: { color: '#294c37', fontWeight: '600' }, error: { color: '#8b3f25', lineHeight: 22 },
});
