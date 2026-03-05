import * as XLSX from 'xlsx';

const data = [
    { Barcode: "12345678", Name: "Power Drill 18V", Price: 89.99, Stock: 24, Category: "Power Tools" },
    { Barcode: "87654321", Name: "Hammer Claw 16oz", Price: 19.99, Stock: 56, Category: "Hand Tools" },
    { Barcode: "55667788", Name: "Screwdriver Set 12pc", Price: 29.99, Stock: 38, Category: "Hand Tools" },
    { Barcode: "99887766", Name: "Paint Roller Kit", Price: 24.99, Stock: 42, Category: "Painting" },
    { Barcode: "11223344", Name: "PVC Pipe 2\" x 10ft", Price: 12.99, Stock: 120, Category: "Plumbing" },
    { Barcode: "44332211", Name: "LED Bulb 60W 4pk", Price: 15.99, Stock: 85, Category: "Electrical" },
    { Barcode: "12123434", Name: "Circular Saw 7.25\"", Price: 129.99, Stock: 12, Category: "Power Tools" },
    { Barcode: "56567878", Name: "Wood Screws Box 100ct", Price: 8.99, Stock: 200, Category: "Fasteners" },
    { Barcode: "90901212", Name: "Safety Goggles", Price: 12.99, Stock: 65, Category: "Safety" },
    { Barcode: "34345656", Name: "Measuring Tape 25ft", Price: 14.99, Stock: 48, Category: "Hand Tools" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

XLSX.writeFile(workbook, "product_import_template.xlsx");
console.log("product_import_template.xlsx created successfully!");
