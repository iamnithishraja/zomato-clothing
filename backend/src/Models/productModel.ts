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
    images: [{
      type: String,
    }],
    price: {
      type: Number,
      required: true
    },
    sizes: [{
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"]
    }],
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
  }, {
    timestamps: true
  });

productSchema.index({ merchantId: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;