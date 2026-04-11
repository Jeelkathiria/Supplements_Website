# Product Variants System Documentation

## 📋 Overview

The product database has been restructured to properly support multiple sizes and flavors with individual pricing for each combination.

---

## 🗄️ Database Schema

### 1. Products Table (Basic Info Only)

```
products
---------
id (PK)
name
description
basePrice         (legacy field)
discountPercent   (legacy field)
finalPrice        (legacy field)
isVegetarian
categoryId        (FK)
categoryName
isFeatured
isSpecialOffer
isOutOfStock
imageUrls[]
createdAt
updatedAt
```

**Purpose**: Store basic product information only. Variants contain detailed pricing.

---

### 2. Product Variants Table (NEW - IMPORTANT)

```
product_variants
----------------
id (PK)
product_id (FK → products.id)

size         (VARCHAR)     -- "340g", "510g", "20g", etc.
flavor       (VARCHAR)     -- "Mango Mayhem", "Cola Frost", etc.

price        (DECIMAL)     -- Base price (e.g., 999)
discount     (DECIMAL)     -- Discount value (e.g., 0, 10, 50)
discount_type (ENUM)       -- "percent" or "flat"
final_price  (DECIMAL)     -- Calculated price after discount

createdAt
updatedAt

Unique Constraint: (product_id, size, flavor)
```

**Purpose**: Store each size/flavor combination with its own pricing.

---

## 📊 Example: Protein Powder Product

### Products Table
```
id: 550e8400-e29b-41d4-a716-446655440000
name: Mango Protein Powder
description: 100% Plant-based Protein
basePrice: 1000
imageUrls: ["http://...proteins/mango.png"]
isFeatured: true
isOutOfStock: false
```

### Product Variants Table
```
id | product_id                           | size  | flavor         | price | discount | discount_type | final_price
---|--------------------------------------|--------|---|-------|-------|----------|------|
v1 | 550e8400-e29b-41d4-a716-446655440000| 340g   | Mango Mayhem   | 999   | 0        | percent      | 999
v2 | 550e8400-e29b-41d4-a716-446655440000| 510g   | Mango Mayhem   | 1499  | 10       | percent      | 1349
v3 | 550e8400-e29b-41d4-a716-446655440000| 340g   | Cola Frost     | 950   | 5        | percent      | 902.50
v4 | 550e8400-e29b-41d4-a716-446655440000| 510g   | Cola Frost     | 1400  | 0        | percent      | 1400
v5 | 550e8400-e29b-41d4-a716-446655440000| 340g   | Fruit Fury     | 1000  | 0        | percent      | 1000
v6 | 550e8400-e29b-41d4-a716-446655440000| 510g   | Fruit Fury     | 1499  | 15       | percent      | 1274
```

### Frontend Display (as per your image)
```
╔════════════════════════════════════════════════════════╗
║ Choose Flavour and Weight: Mango Mayhem, 340g         ║
╠════════════════════════════════════════════════════════╣
║ FLAVOUR:                                              ║
║ [Cola Frost] [Fruit Fury] [Mango Mayhem★] [...]      ║
╠════════════════════════════════════════════════════════╣
║ WEIGHT:                                               ║
║ [20g    ] [40g    ] [150g   ] [340g ₹999] [510g ₹1499]║
║          [★Selected]                                   ║
╚════════════════════════════════════════════════════════╝
```

---

## 🔄 Backend Routes

### Create/Update Product with Variants

**POST** `/admin/products`
**PUT** `/admin/products/:id`

```json
{
  "name": "Mango Protein Powder",
  "description": "100% Plant-based",
  "basePrice": 1000,
  "discountPercent": 0,
  "imageUrls": ["url..."],
  "categoryId": "supplements",
  "isFeatured": true,
  "isOutOfStock": false,
  "variants": [
    {
      "size": "340g",
      "flavor": "Mango Mayhem",
      "price": 999,
      "discount": 0,
      "discountType": "percent"
    },
    {
      "size": "510g",
      "flavor": "Mango Mayhem",
      "price": 1499,
      "discount": 10,
      "discountType": "percent"
    }
  ]
}
```

### Variant-Specific Routes

**GET** `/admin/products/:id/variants` - Get all variants for a product
```json
[
  {
    "id": "v1",
    "productId": "550e8400...",
    "size": "340g",
    "flavor": "Mango Mayhem",
    "price": 999,
    "discount": 0,
    "discountType": "percent",
    "finalPrice": 999
  },
  ...
]
```

**POST** `/admin/products/:id/variants` - Create variants (bulk)
```json
{
  "variants": [
    { "size": "340g", "flavor": "Mango Mayhem", "price": 999, ... },
    { "size": "510g", "flavor": "Mango Mayhem", "price": 1499, ... }
  ]
}
```

**PUT** `/admin/products/variants/:variantId` - Update single variant
```json
{
  "price": 1100,
  "discount": 5,
  "discountType": "percent"
}
```

**DELETE** `/admin/products/variants/:variantId` - Delete variant

**GET** `/admin/products/:id/price?flavor=Mango Mayhem&size=340g` - Get price for specific variant

---

## 🎨 Frontend Components

### ProductVariantSelector Component

Location: `frontend/src/app/components/ProductVariantSelector.tsx`

**Features:**
- Display all unique flavors as selectable buttons
- Show sizes with prices for selected flavor
- Highlight selected flavor and size
- Auto-select first available size when flavor changes
- Show final calculated price
- Handle out-of-stock sizes gracefully

**Usage in Product Detail Page:**

```tsx
import { ProductVariantSelector } from "./ProductVariantSelector";
import { fetchProductVariants } from "../../services/productService";

export const ProductDetail = ({ productId }: Props) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    const data = await fetchProductVariants(productId);
    setVariants(data);
  };

  return (
    <div>
      <ProductVariantSelector
        variants={variants}
        productName={product.name}
        onSelect={setSelectedVariant}
      />
      
      {selectedVariant && (
        <div>
          <p>Price: ₹{selectedVariant.finalPrice}</p>
          <button>Add to Cart</button>
        </div>
      )}
    </div>
  );
};
```

---

## 📱 Frontend Service Functions

Location: `frontend/src/services/productService.ts`

### Core Functions

```typescript
// Fetch all variants for a product
fetchProductVariants(productId: string): Promise<ProductVariant[]>

// Create multiple variants at once
createProductVariants(
  productId: string,
  variants: Partial<ProductVariant>[]
): Promise<ProductVariant[]>

// Update a single variant's price/discount
updateVariant(variantId: string, data: Partial<ProductVariant>): Promise<ProductVariant>

// Delete a variant
deleteVariant(variantId: string): Promise<void>

// Get final price for specific flavor + size combination
getVariantPrice(productId: string, flavor: string, size: string): Promise<number>
```

---

## 🔧 How to Use (Admin)

### Add a Product with Multiple Variants

1. **Create Product Form**
   - Fill in: Name, Description, Base Price, Images, Category, etc.
   - Add list of variants

2. **Add Variants**
   - For each size/flavor combination, enter:
     - Size (e.g., "340g", "510g")
     - Flavor (e.g., "Mango Mayhem", "Cola Frost")
     - Price
     - Discount (optional)
     - Discount Type ("percent" or "flat")

3. **Save**
   - Product is created with all variants
   - Database automatically calculates `final_price` for each variant

### Edit Product Variants

1. Click "Edit Product"
2. Modify variant prices/discounts
3. Add new variants
4. Remove variants
5. Save changes

---

## 📦 Data Migration Notes

**IMPORTANT**: The old `variants` JSON field in the Product table is retained for backward compatibility but should not be used. All new data goes to the `product_variants` table.

If you have existing products with JSON variants:
1. Run a migration to convert JSON variants to table rows
2. Update product references to use the new table

---

## ✅ Advantages of This Structure

| Feature | Before (JSON) | After (Table) |
|---------|---------------|---------------|
| Query specific variant | ❌ Extract from JSON | ✅ Direct query |
| Update variant price | ❌ Update entire JSON | ✅ Update single row |
| Index variants | ❌ Not possible | ✅ Index on productId |
| Ensure unique combinations | ❌ Manual validation | ✅ DB constraint |
| Scale to many variants | ⚠️ Large JSON blobs | ✅ Efficient rows |
| Bulk operations | ❌ Complex | ✅ Simple SQL |

---

## 🎯 Next Steps

1. **Update Admin Panel** - Add variant management UI
2. **Update Product Detail** - Show ProductVariantSelector component
3. **Update Cart** - Store selected variant with each item
4. **Update Orders** - Save variant selection in order items
5. **Update Price Display** - Always use variant's finalPrice

