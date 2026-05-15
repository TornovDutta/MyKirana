import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { productService } from '../../services/products';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PRODUCT_CATEGORIES } from '../../constants/config';
import Colors from '../../constants/colors';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet', 'bottle'];

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name || !price || !mrp || !stock) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setLoading(true);
    try {
      await productService.addProduct({
        name,
        category,
        price: parseFloat(price),
        mrp: parseFloat(mrp),
        unit,
        quantity_in_stock: parseInt(stock, 10),
        brand: brand || undefined,
        description: description || undefined,
      });
      Toast.show({ type: 'success', text1: 'Product added!' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to add product' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="Product Name *" placeholder="e.g. Tata Salt 1kg" value={name} onChangeText={setName} />
        <Input label="Brand" placeholder="e.g. Tata" value={brand} onChangeText={setBrand} />
        <Input label="Description" placeholder="Optional description" value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList} contentContainerStyle={styles.chips}>
          {PRODUCT_CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Selling Price (₹) *" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          </View>
          <View style={styles.half}>
            <Input label="MRP (₹) *" placeholder="0.00" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Stock Quantity *" placeholder="0" value={stock} onChangeText={setStock} keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.unitGrid}>
              {UNITS.map((u) => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button title="Add Product" onPress={handleSubmit} loading={loading} fullWidth style={styles.submitBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  chipList: { marginBottom: 16 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  unitChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitText: { fontSize: 12, color: Colors.textSecondary },
  unitTextActive: { color: Colors.white },
  submitBtn: { marginTop: 16 },
});
