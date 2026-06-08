export interface AddressFormData {
  houseFlat: string;
  streetArea: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormData = {
  houseFlat: '',
  streetArea: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

export function formatAddress(form: AddressFormData): string {
  const parts = [
    form.houseFlat.trim(),
    form.streetArea.trim(),
    form.landmark.trim(),
    form.city.trim(),
    form.state.trim(),
    form.pincode.trim(),
    form.country.trim(),
  ].filter(Boolean);
  return parts.join(', ');
}

export function validateAddressForm(form: AddressFormData): string | null {
  if (!form.houseFlat.trim()) return 'House / Flat number is required';
  if (!form.streetArea.trim()) return 'Street / Area is required';
  if (!form.city.trim()) return 'City is required';
  if (!form.state.trim()) return 'State is required';
  if (!form.pincode.trim()) return 'Pincode is required';
  if (!/^\d{6}$/.test(form.pincode.trim())) return 'Pincode must be 6 digits';
  return null;
}

/** Best-effort parse of a comma-separated saved address back into form fields */
export function parseAddressString(address: string): AddressFormData {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { ...EMPTY_ADDRESS_FORM };

  const pincodeIdx = parts.findIndex((p) => /^\d{6}$/.test(p));
  const pincode = pincodeIdx >= 0 ? parts[pincodeIdx] : '';
  const country =
    pincodeIdx >= 0 && parts[pincodeIdx + 1] ? parts[pincodeIdx + 1] : 'India';
  const state = pincodeIdx >= 2 ? parts[pincodeIdx - 1] : parts[parts.length - 2] || '';
  const city = pincodeIdx >= 3 ? parts[pincodeIdx - 2] : parts[parts.length - 3] || '';

  const addressParts = parts.slice(0, Math.max(0, pincodeIdx >= 0 ? pincodeIdx - 2 : parts.length - 3));

  return {
    houseFlat: addressParts[0] || '',
    streetArea: addressParts[1] || '',
    landmark: addressParts[2] || '',
    city,
    state,
    pincode,
    country,
  };
}
