import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },

  category: {
    type: String,
    required: true,
    enum: ["Men", "Women", "Kids", "Unisex"],
  },
  subcategory: {
    type: String,
    enum: [
      "Shirts", "T-Shirts", "Pants", "Jeans", "Shorts", "Jackets", "Suits",
      "Dresses", "Tops", "Sarees", "Kurtas", "Skirts", "Leggings",
      "Hoodies", "Sweatshirts", "Sweaters", "Cardigans", "Blazers", "Coats",
      "Underwear", "Sleepwear", "Activewear", "Swimwear", "Ethnic Wear"
    ],
  },

  images: [{ 
   type: String, 
  }],
  price: {
    type: Number,
    required: true,
  },

  size: { type: String, enum: ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "Free Size"] },
  availableQuantity: { type: Number, default: 0 },

  specifications: {
    material: { type: String, enum: ["Cotton", "Polyester", "Silk", "Wool", "Linen", "Denim", "Leather","Synthetic"] },
    fit: { type: String, enum: ["Slim Fit", "Regular Fit", "Loose Fit", "Oversized"] },
    pattern: { type: String, enum: ["Solid", "Striped", "Printed", "Checkered", "Floral"] },
  },

  season: { type: String, enum: ["Summer", "Winter", "Monsoon", "All Season"] },

  isActive: { type: Boolean, default: true },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
}, {
  timestamps: true,
});

productSchema.index({ merchantId: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ name: "text" });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ specifications: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;
