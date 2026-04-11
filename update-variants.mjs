import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'frontend/src/app/pages/Admin.tsx');

let content = fs.readFileSync(filePath, 'utf-8');

// Step 1: Update EMPTY_FORM
content = content.replace(
  /const EMPTY_FORM: Partial<Product> = \{[\s\S]*?\};/,
  `const EMPTY_FORM: Partial<Product> = {
  name: "",
  description: "",
  categoryId: "",
  productSizes: [],
  flavors: ["Unflavoured"],
  isOutOfStock: false,
  rating: 4.5,
  reviews: 0,
  imageUrls: [],
  isFeatured: false,
  isSpecialOffer: false,
  isVegetarian: false,
};`
);

// Step 2: Replace the SIZES and FLAVORS + PRICING sections with new implementation
const newVariantsSection = `              {/* FLAVORS */}
              <div>
                <label className="mb-3 block text-sm font-medium">Flavors</label>
                
                {/* Flavor Tags */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {(formData.flavors || []).map((flavor) => (
                    <div
                      key={flavor}
                      className="flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1.5 text-sm font-medium"
                    >
                      {flavor}
                      {flavor !== "Unflavoured" && (
                        <button
                          type="button"
                          onClick={() => {
                            const newFlavors = (formData.flavors || []).filter(f => f !== flavor);
                            const newSizes = (formData.productSizes || []).map(size => ({
                              ...size,
                              flavors: size.flavors.filter(f => f.name !== flavor)
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              flavors: newFlavors.length === 0 ? ["Unflavoured"] : newFlavors,
                              productSizes: newSizes
                            }));
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Flavor Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new flavor (e.g., Mango, Chocolate)..."
                    value={formData.newFlavor || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newFlavor: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const flavorName = (formData.newFlavor || "").trim();
                        if (flavorName && !(formData.flavors || []).includes(flavorName)) {
                          const newFlavors = (formData.flavors || []).filter(f => f !== "Unflavoured");
                          setFormData((prev) => ({
                            ...prev,
                            flavors: [...newFlavors, flavorName],
                            newFlavor: ""
                          }));
                        }
                      }
                    }}
                    className="flex-1 rounded-lg border px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const flavorName = (formData.newFlavor || "").trim();
                      if (flavorName && !(formData.flavors || []).includes(flavorName)) {
                        const newFlavors = (formData.flavors || []).filter(f => f !== "Unflavoured");
                        setFormData((prev) => ({
                          ...prev,
                          flavors: [...newFlavors, flavorName],
                          newFlavor: ""
                        }));
                      }
                    }}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                  >
                    Add
                  </button>
                </div>
                {errors.flavors && <p className="mt-1 text-xs text-red-500">{errors.flavors}</p>}
              </div>

              {/* SIZES WITH FLAVORS & PRICING */}
              <div>
                <label className="mb-3 block text-sm font-medium">Sizes & Pricing</label>
                
                {/* Existing Sizes */}
                {(formData.productSizes || []).map((size, sizeIdx) => (
                  <div key={sizeIdx} className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">{size.size}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newSizes = (formData.productSizes || []).filter((_, idx) => idx !== sizeIdx);
                          setFormData((prev) => ({
                            ...prev,
                            productSizes: newSizes
                          }));
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Flavor Pricing for this Size */}
                    <div className="space-y-2">
                      {size.flavors.map((flavorItem, flavorIdx) => (
                        <div key={flavorIdx} className="flex gap-3 items-end bg-white p-2 rounded border">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-neutral-600">Flavor</label>
                            <select
                              value={flavorItem.name}
                              onChange={(e) => {
                                const newSizes = [...(formData.productSizes || [])];
                                newSizes[sizeIdx].flavors[flavorIdx].name = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  productSizes: newSizes
                                }));
                              }}
                              className="w-full text-sm rounded border px-2 py-1"
                            >
                              {(formData.flavors || []).map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-neutral-600">Price (₹)</label>
                            <input
                              type="number"
                              value={flavorItem.price}
                              onChange={(e) => {
                                const newSizes = [...(formData.productSizes || [])];
                                newSizes[sizeIdx].flavors[flavorIdx].price = parseFloat(e.target.value) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  productSizes: newSizes
                                }));
                              }}
                              className="w-full text-sm rounded border px-2 py-1"
                              step="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-neutral-600">Discount (%)</label>
                            <input
                              type="number"
                              value={flavorItem.discount || 0}
                              onChange={(e) => {
                                const newSizes = [...(formData.productSizes || [])];
                                newSizes[sizeIdx].flavors[flavorIdx].discount = parseFloat(e.target.value) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  productSizes: newSizes
                                }));
                              }}
                              className="w-full text-sm rounded border px-2 py-1"
                              step="0.1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSizes = [...(formData.productSizes || [])];
                              newSizes[sizeIdx].flavors.splice(flavorIdx, 1);
                              if (newSizes[sizeIdx].flavors.length === 0) {
                                newSizes.splice(sizeIdx, 1);
                              }
                              setFormData((prev) => ({
                                ...prev,
                                productSizes: newSizes
                              }));
                            }}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Flavor to this Size */}
                    <button
                      type="button"
                      onClick={() => {
                        const newSizes = [...(formData.productSizes || [])];
                        newSizes[sizeIdx].flavors.push({ name: (formData.flavors || ["Unflavoured"])[0], price: 0, discount: 0 });
                        setFormData((prev) => ({
                          ...prev,
                          productSizes: newSizes
                        }));
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Flavor to {size.size}
                    </button>
                  </div>
                ))}

                {/* Add New Size */}
                <div className="rounded-lg border-2 border-dashed border-neutral-300 p-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter size (e.g., 250, 500, 1000)"
                      value={formData.newSizeValue || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newSizeValue: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-lg border px-3 py-2"
                      step="1"
                    />
                    <select
                      value={formData.newSizeUnit || "g"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newSizeUnit: e.target.value,
                        }))
                      }
                      className="rounded-lg border px-3 py-2"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sizeValue = formData.newSizeValue?.trim();
                        if (sizeValue) {
                          const sizeName = \`\${sizeValue}\${formData.newSizeUnit || "g"}\`;
                          if (!(formData.productSizes || []).some(s => s.size === sizeName)) {
                            const newSize = {
                              size: sizeName,
                              flavors: [{
                                name: (formData.flavors || ["Unflavoured"])[0],
                                price: 0,
                                discount: 0
                              }]
                            };
                            setFormData((prev) => ({
                              ...prev,
                              productSizes: [...(prev.productSizes || []), newSize],
                              newSizeValue: "",
                              newSizeUnit: "g"
                            }));
                          }
                        }
                      }}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
                    >
                      Add Size
                    </button>
                  </div>
                </div>
                {errors.productSizes && <p className="mt-2 text-xs text-red-500">{errors.productSizes}</p>}
              </div>`;

// Find and replace the SIZES section through FLAVORS section + pricing
const startMarker = '              {/* SIZES */}';
const endMarker = '              {/* CATEGORY (Dropdown + Add New) */}';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newVariantsSection + '\n\n' + content.substring(endIdx);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Variants system updated successfully!');
