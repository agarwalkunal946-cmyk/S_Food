import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true },
  category: { type: String, required: true, trim: true }, description: { type: String, default: "" },
  brand: { type: String, default: "", trim: true }, unit: { type: String, default: "" }, barcode: { type: String, default: "" },
  origin: { type: String, default: "" }, ingredients: { type: String, default: "" }, allergens: { type: String, default: "" },
  storageInstructions: { type: String, default: "" }, shelfLife: { type: String, default: "" },
  dietaryFlags: { type: [String], default: [] }, nutritionFacts: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0 }, compareAtPrice: { type: Number, default: 0 },
  images: { type: [String], default: [] }, badge: { type: String, default: "" },
  material: { type: String, default: "" }, attributes: { type: [String], default: [] }, stock: { type: Number, default: 0, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 }, reviewCount: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false }, active: { type: Boolean, default: true },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  name: { type: String, default: "Store Admin" }, email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: "main", unique: true }, storeName: { type: String, default: "GATHER & GRAIN" }, storeLogo: { type: String, default: "" },
  storeType: { type: String, default: "food" },
  productLabel: { type: String, default: "Dish" }, productPlural: { type: String, default: "Menu" },
  categoryLabel: { type: String, default: "Menu section" }, addToCartLabel: { type: String, default: "Add to order" },
  viewProductLabel: { type: String, default: "View dish" }, cartLabel: { type: String, default: "Order" },
  themePrimary: { type: String, default: "#71351f" }, themeAccent: { type: String, default: "#d87545" }, themeBackground: { type: String, default: "#fff8ef" },
  announcement: { type: String, default: "Made fresh to order · Free delivery over ₹500" },
  heroEyebrow: { type: String, default: "FRESH FROM OUR KITCHEN" },
  heroTitle: { type: String, default: "Made with love.\nServed with joy." },
  heroText: { type: String, default: "Seasonal ingredients, generous plates, and little moments worth gathering for. Find your new favourite and let us bring it to your table." },
  heroImage: { type: String, default: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2200&q=88" },
  heroCta: { type: String, default: "Explore the menu" },
  introEyebrow: { type: String, default: "COOKED FRESH, SHARED OFTEN" }, introText: { type: String, default: "Good food brings us together." },
  introEmphasis: { type: String, default: "Pull up a chair." },
  collectionEyebrow: { type: String, default: "MADE FRESH TODAY" }, collectionTitle: { type: String, default: "A little something delicious." },
  categoryEyebrow: { type: String, default: "FIND YOUR CRAVING" }, categoryTitle: { type: String, default: "Something good is cooking." },
  categoryText: { type: String, default: "A little comfort, a lot of flavour, and something lovely for every appetite." },
  categoryImages: { type: [String], default: [] },
  storyEyebrow: { type: String, default: "OUR TABLE, YOUR TABLE" },
  storyTitle: { type: String, default: "Gather close. Eat well." },
  storyText: { type: String, default: "We believe the best meals are the ones shared. Every dish starts with ingredients chosen with care, recipes made to be passed around, and a little extra for the table." },
  storyImage: { type: String, default: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" },
  newsletterTitle: { type: String, default: "A seat at our table." },
  newsletterText: { type: String, default: "Seasonal specials, fresh menus, and good things from our kitchen." },
  newsletterEyebrow: { type: String, default: "A LITTLE SOMETHING DELICIOUS" },
  shopEyebrow: { type: String, default: "FRESH FROM THE KITCHEN" }, shopTitle: { type: String, default: "Made fresh. Ordered easy." },
  shopText: { type: String, default: "A menu of familiar favourites and new discoveries, prepared with care." },
  footerTagline: { type: String, default: "Good food. Good company." }, footerNote: { type: String, default: "Made fresh, shared with love." }, footerAside: { type: String, default: "Thoughtful ingredients, generous plates, and recipes worth gathering around." },
  footerExploreLabel: { type: String, default: "THE MENU" }, footerHelpLabel: { type: String, default: "HERE TO HELP" },
  contactEmail: { type: String, default: "hello@gatherandgrain.local" },
  shippingPerkTitle: { type: String, default: "Freshness at your door." }, shippingPerkText: { type: String, default: "Free delivery on orders over {threshold}." },
  currency: { type: String, default: "INR" }, shippingThreshold: { type: Number, default: 500 }, shippingFee: { type: Number, default: 60 },
  categories: { type: [String], default: ["Small Plates", "Mains", "Bowls & Salads", "Bakery", "Desserts", "Drinks"] },
  values: { type: [String], default: ["Fresh ingredients, every day", "Cooked with care", "Recipes made to share", "Delivered warm to your door"] },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, customer: { type: String, required: true },
  email: { type: String, required: true }, phone: { type: String, default: "" },
  address: { type: String, required: true }, city: { type: String, default: "" }, postalCode: { type: String, default: "" },
  fulfillmentMethod: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
  items: [{ productId: String, name: String, image: String, price: Number, quantity: Number, unit: String }],
  subtotal: { type: Number, required: true }, shipping: { type: Number, default: 0 }, total: { type: Number, required: true },
  currency: { type: String, default: "INR" }, paymentGateway: { type: String, default: "" },
  paymentStatus: { type: String, enum: ["Pending", "Verifying", "Paid", "Failed", "Review Required", "Refunded", ""], default: "" },
  razorpayOrderId: { type: String, default: "", index: true }, razorpayPaymentId: { type: String, default: "" }, paymentNote: { type: String, default: "" },
  status: { type: String, enum: ["New", "Processing", "Shipped", "Delivered", "Cancelled"], default: "New" },
}, { timestamps: true });

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export const StoreSettings = mongoose.models.StoreSettings || mongoose.model("StoreSettings", settingsSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const Subscriber = mongoose.models.Subscriber || mongoose.model("Subscriber", subscriberSchema);
