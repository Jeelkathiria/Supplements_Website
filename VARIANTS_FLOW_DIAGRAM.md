# Product Variants - System Flow Diagram

## 🔄 Data Flow: Admin Creates Product

```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN PANEL - Add/Edit Product Modal                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Product Form:                                              │
│  ├─ Name: "Mango Protein Powder"                           │
│  ├─ Description: "Plant-based"                             │
│  ├─ Base Price: 1000                                       │
│  ├─ Images: [...]                                          │
│  └─ Variants:                                              │
│     ├─ Row 1: 340g | Mango | 999 | 0% | ₹999             │
│     ├─ Row 2: 510g | Mango | 1499 | 10% | ₹1349          │
│     └─ Row 3: 340g | Cola | 950 | 5% | ₹902.50           │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Click SAVE
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND SERVICE (productService.ts)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  createProduct({                                            │
│    name: "Mango Protein Powder",                           │
│    basePrice: 1000,                                        │
│    variants: [                                             │
│      { size: "340g", flavor: "Mango", price: 999, ... },  │
│      { size: "510g", flavor: "Mango", price: 1499, ... }, │
│      { size: "340g", flavor: "Cola", price: 950, ... }    │
│    ]                                                        │
│  })                                                         │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ POST /admin/products
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND API (adminProducts.ts)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Create Product:                                         │
│     INSERT INTO products (name, description, ...) →        │
│     Returns: { id: "p1", name: "Mango Protein...", ... }  │
│                                                             │
│  2. Create Variants:                                        │
│     INSERT INTO product_variants                           │
│     (productId, size, flavor, price, discount, finalPrice) │
│     VALUES ("p1", "340g", "Mango", 999, 0, 999)           │
│     VALUES ("p1", "510g", "Mango", 1499, 10, 1349)        │
│     VALUES ("p1", "340g", "Cola", 950, 5, 902.50)         │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Success response
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  DATABASE                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                             │
│  PRODUCTS Table:                                            │
│  ┌────────┬─────────────────────┬──────────────────────┐    │
│  │ id     │ name                │ basePrice            │    │
│  ├────────┼─────────────────────┼──────────────────────┤    │
│  │ p1     │ Mango Protein Pdr   │ 1000                 │    │
│  └────────┴─────────────────────┴──────────────────────┘    │
│                                                             │
│  PRODUCT_VARIANTS Table:                                    │
│  ┌────────┬────────┬────────┬──────┬────────┬──────────┐   │
│  │ id     │ product│ size   │ flav │ price  │ finalPrice
│  ├────────┼────────┼────────┼──────┼────────┼──────────┤   │
│  │ v1     │ p1     │ 340g   │ Mang │ 999    │ 999      │   │
│  │ v2     │ p1     │ 510g   │ Mang │ 1499   │ 1349★10% │   │
│  │ v3     │ p1     │ 340g   │ Cola │ 950    │ 902.5★5% │   │
│  └────────┴────────┴────────┴──────┴────────┴──────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Customer Views Product

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT LISTING PAGE                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [PRODUCT CARD]                                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ [Image: Mango Protein Powder]                        │  │
│  │ Name: Mango Protein Powder                           │  │
│  │ Price from: ₹902 (lowest variant price)             │  │
│  │ [View Details Button]                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Click "View Details"
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT DETAIL PAGE                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useEffect(() => {                                          │
│    fetchProductVariants(productId) → GET /products/:id/... │
│    setVariants(data)                                       │
│  }, [productId])                                           │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Fetch variants
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND API - Fetch Variants                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GET /admin/products/p1/variants                            │
│                                                             │
│  SELECT * FROM product_variants                            │
│  WHERE productId = 'p1'                                    │
│  ORDER BY flavor, size                                     │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ Returns array of variants
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND - RENDER ProductVariantSelector                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║ Choose Flavour and Weight: [Mango Mayhem], [340g]   ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║ Flavour:                                           ║ │
│  ║ [Cola Frost] [Fruit Fury] [Mango★] [...]          ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║ Weight:                                            ║ │
│  ║ [20g] [40g] [150g] [340g★ ₹999] [510g ₹1349] [540g] ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║ Selected: Mango Mayhem - 340g                      ║ │
│  ║ Price: ₹999                                        ║ │
│  ║ [Add to Cart Button]                               ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ User selects variant & clicks "Add to Cart"
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  ADD TO CART                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CartItem {                                                 │
│    productId: "p1",                                        │
│    variantId: "v1",  ← NEW: Store which variant!          │
│    size: "340g",                                           │
│    flavor: "Mango",                                        │
│    price: 999,        ← Use variant's finalPrice          │
│    quantity: 1                                             │
│  }                                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛒 Cart to Order Flow

```
PRODUCT_VARIANTS (from DB)
├─ ID: v1
├─ Product: p1 (Mango Protein)
├─ Size: 340g
├─ Flavor: Mango Mayhem
├─ Price: 999
├─ Discount: 0
└─ Final Price: ₹999

           │
           ▼

CART_ITEM (in memory/DB)
├─ Product ID: p1
├─ Variant ID: v1  ← KEY: Track variant
├─ Size: "340g"
├─ Flavor: "Mango"
├─ Quantity: 1
├─ Unit Price: 999
└─ Total: ₹999

           │
           ▼

ORDER_ITEM (saved in DB)
├─ Order ID: o1
├─ Product ID: p1
├─ Variant ID: v1  ← CRITICAL: Preserve variant info
├─ Size: "340g"
├─ Flavor: "Mango"
├─ Price @ Order Time: ₹999
├─ Quantity: 1
└─ Line Total: ₹999

           │
           ▼

FUTURE DELIVERY
├─ Warehouse picks product based on variant
├─ Item: 340g Mango Mayhem (not just any protein)
└─ Customer gets correct size/flavor
```

---

## 📊 Variant Selection Logic

```
User clicks FLAVOR button
         │
         ▼
setSelectedFlavor(flavor)
         │
         ▼
Find all variants with this flavor
availableSizes = filter(variants, flavor === selected)
         │
         ▼
If current size NOT in available sizes:
  Auto-select first available size
         │
         ▼
Find matching variant:
selectedVariant = find(variants, {
  flavor === selected,
  size === selected
})
         │
         ▼
Display:
├─ Show available sizes for THIS flavor
├─ Highlight selected size
├─ Show price of selected variant
├─ Disable unavailable sizes
└─ disable button if no variants available
```

---

## 🔍 Key Search/Filter Queries

### Get all unique flavors for a product
```sql
SELECT DISTINCT flavor 
FROM product_variants 
WHERE productId = 'p1'
ORDER BY flavor
```

### Get all sizes for a product
```sql
SELECT DISTINCT size 
FROM product_variants 
WHERE productId = 'p1'
ORDER BY size
```

### Get price for specific combo
```sql
SELECT finalPrice 
FROM product_variants 
WHERE productId = 'p1' 
  AND flavor = 'Mango Mayhem' 
  AND size = '340g'
```

### Get lowest price for product
```sql
SELECT MIN(finalPrice) as minPrice
FROM product_variants 
WHERE productId = 'p1'
```

---

## 🎯 Error Handling

```
VARIANT NOT FOUND
├─ Check: flavor in available flavors?
├─ Check: size in available sizes for flavor?
├─ Check: combo exists in variants?
└─ Action: Show error, disable buttons, or fallback to first variant

OUT OF STOCK
├─ Check: product.isOutOfStock = true?
├─ Check: all variants out? (future enhancement)
└─ Action: Show "Out of Stock" badge, disable "Add to Cart"

PRICE MISMATCH
├─ Always use variant.finalPrice (never recalculate)
├─ Never trust frontend-calculated price in backend
└─ Validate price matches DB on order creation
```

---

## ✅ Implementation Checklist

- [x] Database schema created
- [x] Migration applied
- [x] Backend routes implemented
- [x] Frontend service functions added
- [x] ProductVariantSelector component created
- [ ] Admin panel variant management UI
- [ ] Product detail page integration
- [ ] Cart updates to store variant info
- [ ] Order system updates
- [ ] Checkout with variant prices
- [ ] Order confirmation shows variant details
- [ ] Data validation (price integrity)
- [ ] Error handling for missing variants

