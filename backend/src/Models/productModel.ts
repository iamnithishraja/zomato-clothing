import mongoose from "mongoose";

// Product Model (Clothing products sold by merchants)
const productSchema = new mongoose.Schema({
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Kids"],
    },
    subcategory: {
      type: String,
      required: true,
      enum: [
        "Shirts", "T-Shirts", "Pants", "Jeans", "Dresses", "Tops", 
        "Jackets", "Shoes", "Accessories", "Kids Wear"
      ]
    },
    images: [{
      type: String,
      required: true
    }],
    price: {
      type: Number,
      required: true
    },
    sizes: [{
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"]
    }],
    colors: [{
      name: {
        type: String,
        required: true
      },
      code: String // Hex code (optional)
    }],
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
    brand: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      enum: ["Cotton", "Polyester", "Silk", "Denim", "Leather", "Mixed"]
    },
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true
  });

productSchema.index({ merchantId: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;