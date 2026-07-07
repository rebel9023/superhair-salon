import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  salonName: string;
  logo: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  contactPhone: string;
  contactEmail: string;
  vatGstNumber: string;
  currencySymbol: string;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    salonName: { type: String, required: true, default: 'Super Art Hair Salon' },
    logo: { type: String, default: '' },
    address: {
      street: { type: String, default: '123 Fashion Blvd' },
      city: { type: String, default: 'Mumbai' },
      state: { type: String, default: 'Maharashtra' },
      zip: { type: String, default: '400001' },
      country: { type: String, default: 'India' }
    },
    contactPhone: { type: String, default: '+919999999999' },
    contactEmail: { type: String, default: 'contact@superartsalon.com' },
    vatGstNumber: { type: String, default: '27AAAAA1111A1Z1' },
    currencySymbol: { type: String, default: '₹' }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
export default Settings;
