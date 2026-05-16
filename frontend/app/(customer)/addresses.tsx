import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { addressService } from '../../services/addresses';
import { SavedAddress } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Colors from '../../constants/colors';

const LABELS = ['Home', 'Work', 'Other'];

const emptyForm = { label: 'Home', address: '', city: '', pincode: '' };

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      const data = await addressService.list();
      setAddresses(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load addresses' });
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalVisible(true);
  }

  function openEdit(addr: SavedAddress) {
    setEditing(addr);
    setForm({ label: addr.label, address: addr.address, city: addr.city, pincode: addr.pincode });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.address || !form.city || !form.pincode) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await addressService.update(editing.id, form);
        setAddresses((prev) => prev.map((a) => (a.id === editing.id ? { ...a, ...form } : a)));
        Toast.show({ type: 'success', text1: 'Address updated' });
      } else {
        const created = await addressService.add(form);
        setAddresses((prev) => [...prev, created]);
        Toast.show({ type: 'success', text1: 'Address saved' });
      }
      setModalVisible(false);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save address' });
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(addr: SavedAddress) {
    Alert.alert('Delete Address', `Remove "${addr.label}" address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await addressService.remove(addr.id);
            setAddresses((prev) => prev.filter((a) => a.id !== addr.id));
            Toast.show({ type: 'success', text1: 'Address removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete address' });
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyText}>No saved addresses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add a delivery address</Text>
            </View>
          )}
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.labelBadge}>
                  <Ionicons
                    name={addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'briefcase' : 'location'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.labelText}>{addr.label}</Text>
                </View>
                <Text style={styles.addressLine}>{addr.address}</Text>
                <Text style={styles.cityLine}>{addr.city} - {addr.pincode}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEdit(addr)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={19} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={19} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Address' : 'New Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Label</Text>
            <View style={styles.labelRow}>
              {LABELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, form.label === l && styles.labelChipActive]}
                  onPress={() => setForm((f) => ({ ...f, label: l }))}
                >
                  <Text style={[styles.labelChipText, form.label === l && styles.labelChipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Street Address"
              placeholder="House no, street, area"
              value={form.address}
              onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
              leftIcon="home-outline"
            />
            <Input
              label="City"
              placeholder="City"
              value={form.city}
              onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              leftIcon="business-outline"
            />
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              value={form.pincode}
              onChangeText={(v) => setForm((f) => ({ ...f, pincode: v }))}
              keyboardType="numeric"
              maxLength={6}
              leftIcon="location-outline"
            />

            <Button title={editing ? 'Update Address' : 'Save Address'} onPress={handleSave} loading={saving} fullWidth />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, marginLeft: 12 },
  addBtn: { padding: 4 },
  loader: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.gray },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  labelText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  addressLine: { fontSize: 14, color: Colors.text },
  cityLine: { fontSize: 13, color: Colors.textSecondary },
  cardActions: { gap: 10 },
  actionBtn: { padding: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 8 },
  labelRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  labelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  labelChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  labelChipText: { fontSize: 14, color: Colors.textSecondary },
  labelChipTextActive: { color: Colors.primary, fontWeight: '600' },
});
