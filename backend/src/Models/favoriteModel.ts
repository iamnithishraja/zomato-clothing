import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
}, {
  timestamps: true,
});

// Create compound index to ensure one favorite per user-product combination
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

const FavoriteModel = mongoose.model<IFavorite>("Favorite", favoriteSchema);

export default FavoriteModel;
