import mongoose, { Schema, Document } from "mongoose";

/**
 * @interface IItemVariant
 * @description Defines the structure for a menu item variant (e.g., Small, Medium, Large).
 * Each variant has its own bilingual name and price. This is an embedded sub-document.
 */
export interface IItemVariant {
  name: {
    en: string;
    am: string;
  };
  price: number;
}

/**
 * @interface IMenuItem
 * @description Represents the complete structure of a Menu Item in the database.
 * This is the main document interface, extending Mongoose's Document type.
 */
export interface IMenuItem extends Document {
  name: {
    en: string;
    am: string;
  };
  category: mongoose.Schema.Types.ObjectId; // Reference to the Category model
  price: number; // The default price, only required if there are no variants
  variants: IItemVariant[]; // An array of variants
  imageUrl?: string; // Optional URL for the item's image hosted on Cloudinary

  // --- Inventory Management Features (Option A) ---
  trackInventory: boolean; // If true, the system will track the stock of this item
  stock: number; // Current quantity in stock
  lowStockAlert: number; // A threshold to trigger low stock warnings for the owner

  // --- Manual Availability Toggle ("86-ing") ---
  isAvailable: boolean; // Owner can manually toggle this to make an item unavailable

  // --- Add-On Association ---
  availableAddOns: mongoose.Schema.Types.ObjectId[]; // An array of references to available AddOn models
}

/**
 * @const variantSchema
 * @description The Mongoose schema for the embedded IItemVariant sub-document.
 * We set `_id: false` because it's generally not needed for sub-documents
 * and keeps the main document cleaner.
 */
const variantSchema: Schema = new Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "Variant English name is required."],
      },
      am: {
        type: String,
        required: [true, "Variant Amharic name is required."],
      },
    },
    price: {
      type: Number,
      required: [true, "Variant price is required."],
    },
  },
  { _id: false }
);

/**
 * @const menuItemSchema
 * @description The main Mongoose schema for a MenuItem.
 */
const menuItemSchema: Schema = new Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "Menu item must have an English name."],
        trim: true,
      },
      am: {
        type: String,
        required: [true, "Menu item must have an Amharic name."],
        trim: true,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Establishes a link to the 'Category' collection
      required: [true, "A menu item must belong to a category."],
    },
    variants: [variantSchema],
    price: {
      type: Number,
      // The price is only required if the item has no variants.
      // This function checks the state of the document before validation.
      required: [
        function (this: IMenuItem): boolean {
          return !this.variants || this.variants.length === 0;
        },
        "A base price is required if the item has no variants.",
      ],
    },
    imageUrl: {
      type: String,
    },
    trackInventory: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 0,
    },
    lowStockAlert: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    availableAddOns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddOn", // Establishes a link to the 'AddOn' collection
      },
    ],
  },
  {
    // Enable automatic `createdAt` and `updatedAt` timestamps
    timestamps: true,
  }
);

/**
 * Mongoose Middleware: `pre(/^find/)`
 *
 * This hook runs before any query that starts with 'find' (e.g., find, findOne, findById).
 * It automatically populates the referenced `category` and `availableAddOns` fields.
 * This is incredibly useful as it means we don't have to manually .populate() in every
 * controller, keeping our code clean and ensuring the frontend always gets the data it needs.
 */
menuItemSchema.pre(/^find/, function (this: any, next) {
  this.populate({
    path: "category",
    select: "name station", // Only select the fields we need from the category
  }).populate({
    path: "availableAddOns",
    select: "name price", // Only select the fields we need from the add-ons
  });
  next();
});

// Export the model, linking it to the IMenuItem interface for strong TypeScript typing.
export default mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
