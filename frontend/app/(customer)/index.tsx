import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shopService } from '../../services/shops';
import { useLocation } from '../../hooks/useLocation';
import { useAuthStore } from '../../stores/authStore';
import ShopCard from '../../components/ShopCard';
import { Shop } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants/config';
import Colors from '../../constants/colors';

export default function CustomerHome() {
  const { user } = useAuthStore();
  const { lat, lng, loading: locLoading } = useLocation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      const data = await shopService.getNearby(lat, lng, 10, category ?? undefined);
      setShops(data);
    } catch {
      /* handled silently */
    } finally {
      setLoading(false);
    }
  }, [lat, lng, category]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  };

  const filtered = search ? shops.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase())) : shops;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.locationText}>{locLoading ? 'Getting location...' : lat ? 'Location found' : 'Location unavailable'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textLight}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={Colors.gray} /></TouchableOpacity> : null}
      </View>

      <FlatList
        horizontal
        data={[null, ...PRODUCT_CATEGORIES]}
        keyExtractor={(item) => item ?? '__all__'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, category === item && styles.catChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.catText, category === item && styles.catTextActive]}>{item ?? 'All'}</Text>
          </TouchableOpacity>
        )}
        style={styles.categoryList}
      />

      {locLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /><Text style={styles.hint}>Detecting your location...</Text></View>
      ) : !lat ? (
        <View style={styles.center}><Ionicons name="location-outline" size={48} color={Colors.gray} /><Text style={styles.hint}>Location permission required to find nearby shops</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <ShopCard shop={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="storefront-outline" size={48} color={Colors.gray} />
                <Text style={styles.hint}>No shops found nearby</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: 16, borderRadius: 10, paddingHorizontal: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text },
  categoryList: { maxHeight: 44 },
  categories: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: Colors.white, fontWeight: '600' },
  list: { paddingTop: 8, paddingBottom: 80 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  hint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
