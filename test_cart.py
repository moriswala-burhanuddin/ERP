import requests

session = "12345"
base_url = "https://erp.tmr-tools.com/api/v1/store/cart"

print("1. Adding item to cart...")
r1 = requests.post(f"{base_url}/add/", headers={"x-cart-session": session}, json={"project_id": "p-123", "quantity": 1})
if r1.status_code != 200:
    print("Add failed:", r1.text)

print("2. Fetching cart to get item ID...")
r2 = requests.get(f"{base_url}/", headers={"x-cart-session": session})
cart = r2.json()
if not cart.get("items"):
    print("Cart is empty!")
else:
    item_id = cart["items"][0]["id"]
    print(f"Item ID: {item_id}")
    
    print("3. Updating quantity via PATCH...")
    r3 = requests.patch(f"{base_url}/items/{item_id}/", headers={"x-cart-session": session}, json={"quantity": 5})
    print(f"Status: {r3.status_code}")
    print(f"Response: {r3.text}")
