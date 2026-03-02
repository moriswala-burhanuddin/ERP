import * as XLSX from 'xlsx';

const data = [
    // 1. Update Existing Product (prod-1)
    // Current Stock: 24. We add 10 -> Expected Result: 34 (if logic is correct)
    { name: "Power Drill 18V", barcode: "12345678", price: 89.99, stock: 10, category: "Power Tools" },

    // 2. Create New Valid Product
    { name: "Super Glue", barcode: "99887766", price: 5.99, stock: 100, category: "Adhesives" },

    // 3. Create Another New Product
    { name: "Duct Tape", barcode: "55667788", price: 8.50, stock: 45, category: "Adhesives" },

    // 4. Validation Error (Negative Stock)
    { name: "Broken Item", barcode: "00000000", price: 10, stock: -5, category: "Errors" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

XLSX.writeFile(workbook, "new_sample_inventory.xlsx");
console.log("new_sample_inventory.xlsx created successfully!");
