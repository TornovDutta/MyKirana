import React, { useEffect, useReducer, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
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

interface AddressesState {
  addresses: SavedAddress[];
  loading: boolean;
  modalVisible: boolean;
  saving: boolean;
  editing: SavedAddress | null;
  form: typeof emptyForm;
}
type AddressesAction =
  | { type: 'set_addresses'; value: SavedAddress[] }
  | { type: 'set_loading'; value: boolean }
  | { type: 'open_add' }
  | { type: 'open_edit'; value: SavedAddress }
  | { type: 'close_modal' }
  | { type: 'set_saving'; value: boolean }
  | { type: 'patch_form'; value: Partial<typeof emptyForm> }
  | { type: 'address_updated'; id: string; patch: typeof emptyForm }
  | { type: 'address_added'; value: SavedAddress }
  | { type: 'address_removed'; value: string };
function addressesReducer(state: AddressesState, action: AddressesAction): AddressesState {
  switch (action.type) {
    case 'set_addresses': return { ...state, addresses: action.value };
    case 'set_loading': return { ...state, loading: action.value };
    case 'open_add': return { ...state, editing: null, form: emptyForm, modalVisible: true };
    case 'open_edit': return { ...state, editing: action.value, form: { label: action.value.label, address: action.value.address, city: action.value.city, pincode: action.value.pincode }, modalVisible: true };
    case 'close_modal': return { ...state, modalVisible: false };
    case 'set_saving': return { ...state, saving: action.value };
    case 'patch_form': return { ...state, form: { ...state.form, ...action.value } };
    case 'address_updated': return { ...state, addresses: state.addresses.map((a) => a.id === action.id ? { ...a, ...action.patch } : a), modalVisible: false };
    case 'address_added': return { ...state, addresses: [...state.addresses, action.value], modalVisible: false };
    case 'address_removed': return { ...state, addresses: state.addresses.filter((a) => a.id !== action.value) };
  }
}

export default function AddressesScreen() {
  const [state, dispatch] = useReducer(addressesReducer, { addresses: [], loading: true, modalVisible: false, saving: false, editing: null, form: emptyForm });
  const { addresses, loading, modalVisible, saving, editing, form } = state;

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      const data = await addressService.list();
      dispatch({ type: 'set_addresses', value: data });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load addresses' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }

  const openAdd = useCallback(() => {
    dispatch({ type: 'open_add' });
  }, []);

  const openEdit = useCallback((addr: SavedAddress) => {
    dispatch({ type: 'open_edit', value: addr });
  }, []);

  async function handleSave() {
    if (!form.address || !form.city || !form.pincode) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    dispatch({ type: 'set_saving', value: true });
    try {
      if (editing) {
        await addressService.update(editing.id, form);
        dispatch({ type: 'address_updated', id: editing.id, patch: form });
        Toast.show({ type: 'success', text1: 'Address updated' });
      } else {
        const created = await addressService.add(form);
        dispatch({ type: 'address_added', value: created });
        Toast.show({ type: 'success', text1: 'Address saved' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save address' });
    } finally {
      dispatch({ type: 'set_saving', value: false });
    }
  }

  const handleDelete = useCallback((addr: SavedAddress) => {
    Alert.alert('Delete Address', `Remove "${addr.label}" address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await addressService.remove(addr.id);
            dispatch({ type: 'address_removed', value: addr.id });
            Toast.show({ type: 'success', text1: 'Address removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete address' });
          }
        },
      },
    ]);
  }, []);

  const renderAddressCard = useCallback(({ item: addr }: { item: SavedAddress }) => (
    <View style={styles.card}>
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
        <Pressable onPress={() => openEdit(addr)} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={19} color={Colors.textSecondary} />
        </Pressable>
        <Pressable onPress={() => handleDelete(addr)} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={19} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  ), [openEdit, handleDelete]);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <Pressable onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={Colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} size="large" />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(addr) => addr.id}
          renderItem={renderAddressCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyText}>No saved addresses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add a delivery address</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => dispatch({ type: 'close_modal' })}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Address' : 'New Address'}</Text>
              <Pressable onPress={() => dispatch({ type: 'close_modal' })}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Label</Text>
            <View style={styles.labelRow}>
              {LABELS.map((l) => (
                <Pressable
                  key={l}
                  style={[styles.labelChip, form.label === l && styles.labelChipActive]}
                  onPress={() => dispatch({ type: 'patch_form', value: { label: l } })}
                >
                  <Text style={[styles.labelChipText, form.label === l && styles.labelChipTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Street Address"
              placeholder="House no, street, area"
              value={form.address}
              onChangeText={(v) => dispatch({ type: 'patch_form', value: { address: v } })}
              leftIcon="home-outline"
            />
            <Input
              label="City"
              placeholder="City"
              value={form.city}
              onChangeText={(v) => dispatch({ type: 'patch_form', value: { city: v } })}
              leftIcon="business-outline"
            />
            <Input
              label="Pincode"
              placeholder="6-digit pincode"
              value={form.pincode}
              onChangeText={(v) => dispatch({ type: 'patch_form', value: { pincode: v } })}
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
