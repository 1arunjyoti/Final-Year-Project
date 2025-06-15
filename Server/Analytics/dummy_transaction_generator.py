import random
import datetime
import sys
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import os

# Database connection settings - update these to match your environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.evujabwwvgxmasemxjkz:Tony2056*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres")

# Connect to the database
try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("Connected to the database successfully!")
except Exception as e:
    print(f"Error connecting to the database: {e}")
    sys.exit(1)

# Get existing user IDs from the database
def get_user_ids():
    try:
        cursor.execute("SELECT id FROM users")
        user_ids = [row[0] for row in cursor.fetchall()]
        if not user_ids:
            print("No users found in the database. Please create at least one user first.")
            sys.exit(1)
        return user_ids
    except Exception as e:
        print(f"Error fetching user IDs: {e}")
        sys.exit(1)
        
# If you want to use a fixed user ID for testing
DEFAULT_USER_ID = 1

# Define items and their unit prices (based on the image and expanded)
items = {
    "Basmati rice": {"unit": "kg", "price": 75, "unit_options": [0.5, 1, 2, 5, 10, 20]},
    "Red lentils": {"unit": "kg", "price": 140, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Mustard oil": {"unit": "L", "price": 180, "unit_options": [0.2, 0.5, 1, 2, 5, 10]},
    "Salt": {"unit": "kg", "price": 25, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Atta": {"unit": "kg", "price": 60, "unit_options": [0.5, 1, 2, 5, 10, 25]},
    "Maida": {"unit": "kg", "price": 85, "unit_options": [0.5, 1, 2, 5, 10, 25]},
    "Sugar": {"unit": "kg", "price": 45, "unit_options": [0.25, 0.5, 1, 2, 5, 10]},
    "Turmeric powder": {"unit": "gm", "price": 0.25, "unit_options": [50, 100, 200, 500, 1000]},
    "Tea leaves": {"unit": "gm", "price": 0.5, "unit_options": [50, 100, 250, 500, 1000]},
    "Groundnut oil": {"unit": "L", "price": 210, "unit_options": [0.2, 0.5, 1, 2, 5, 10]},
    "Jaggery": {"unit": "gm", "price": 0.09, "unit_options": [100, 250, 500, 1000, 2000]},
    "Red chilli powder": {"unit": "gm", "price": 0.4, "unit_options": [50, 100, 200, 500, 1000]},
    "Cumin seeds": {"unit": "gm", "price": 0.18, "unit_options": [50, 100, 250, 500, 1000]},
    "Black pepper": {"unit": "gm", "price": 0.75, "unit_options": [25, 50, 100, 200, 500]},
    "Coriander powder": {"unit": "gm", "price": 0.16, "unit_options": [50, 100, 200, 500, 1000]},
    "Cardamom": {"unit": "gm", "price": 2.5, "unit_options": [10, 25, 50, 100, 200]},
    "Cloves": {"unit": "gm", "price": 0.9, "unit_options": [10, 25, 50, 100, 200]},
    "Green gram": {"unit": "kg", "price": 120, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Chickpeas": {"unit": "kg", "price": 70, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Bay leaves": {"unit": "gm", "price": 0.6, "unit_options": [25, 50, 100, 200, 500]},
    "Dry red chilli": {"unit": "gm", "price": 0.2, "unit_options": [50, 100, 200, 500, 1000]},
    "Moong dal": {"unit": "kg", "price": 150, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Masoor dal": {"unit": "kg", "price": 130, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Refined oil": {"unit": "L", "price": 145, "unit_options": [0.2, 0.5, 1, 2, 5, 10]},
    "Sunflower oil": {"unit": "L", "price": 160, "unit_options": [0.2, 0.5, 1, 2, 5, 10]},
    "Besan": {"unit": "kg", "price": 95, "unit_options": [0.5, 1, 2, 5, 10]},
    "Toor dal": {"unit": "kg", "price": 135, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Urad dal": {"unit": "kg", "price": 145, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Poha": {"unit": "kg", "price": 70, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Sooji": {"unit": "kg", "price": 55, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Ghee": {"unit": "kg", "price": 600, "unit_options": [0.1, 0.25, 0.5, 1, 2]},
    "Coconut oil": {"unit": "L", "price": 210, "unit_options": [0.2, 0.5, 1, 2]},
    "Tamarind": {"unit": "gm", "price": 0.22, "unit_options": [50, 100, 250, 500, 1000]},
    "Fennel seeds": {"unit": "gm", "price": 0.25, "unit_options": [50, 100, 200, 500]},
    "Fenugreek seeds": {"unit": "gm", "price": 0.1, "unit_options": [50, 100, 200, 500]},
    "Asafoetida": {"unit": "gm", "price": 2.5, "unit_options": [25, 50, 100, 200]},
    "Cashew nuts": {"unit": "gm", "price": 0.8, "unit_options": [50, 100, 250, 500, 1000]},
    "Almonds": {"unit": "gm", "price": 0.9, "unit_options": [50, 100, 250, 500, 1000]},
    "Raisins": {"unit": "gm", "price": 0.45, "unit_options": [50, 100, 250, 500, 1000]},
    "Peanuts": {"unit": "kg", "price": 150, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Chana dal": {"unit": "kg", "price": 105, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Rajma": {"unit": "kg", "price": 150, "unit_options": [0.25, 0.5, 1, 2, 5]},
    "Sago": {"unit": "kg", "price": 110, "unit_options": [0.25, 0.5, 1, 2]},
    "Vermicelli": {"unit": "kg", "price": 85, "unit_options": [0.25, 0.5, 1, 2]},
    "Baking soda": {"unit": "gm", "price": 0.1, "unit_options": [50, 100, 200, 500]},
    "Baking powder": {"unit": "gm", "price": 0.2, "unit_options": [50, 100, 200, 500]},
    "Custard powder": {"unit": "gm", "price": 0.35, "unit_options": [50, 100, 200, 500]},
    "Jelly crystals": {"unit": "gm", "price": 0.28, "unit_options": [50, 100, 200, 500]},
    "Honey": {"unit": "gm", "price": 0.7, "unit_options": [100, 250, 500, 1000]},
    "Jam": {"unit": "gm", "price": 0.3, "unit_options": [100, 250, 500, 1000]},
    "Pickle": {"unit": "gm", "price": 0.25, "unit_options": [100, 250, 500, 1000]},
    "Papad": {"unit": "gm", "price": 0.4, "unit_options": [50, 100, 200, 500]}
}

# Generate a date within the last 2 months
def generate_date(order_id, total_orders):
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=730)  # 2 years period
    days_between = (end_date - start_date).days
    date_position = (int(order_id) - 1) / total_orders
    days_to_add = int(days_between * date_position)

    return (start_date + datetime.timedelta(days=days_to_add)).strftime("%Y-%m-%d")

# Format quantity string based on unit and value
def format_quantity(quantity, unit):
    if unit == "kg" or unit == "L":
        return f"{quantity}{unit}"
    elif unit == "gm":
        return f"{int(quantity)}gm"
    return str(quantity) + unit

# Generate transactions with 2-7 items per order
def generate_transactions(num_transactions=300):
    # Use a fixed user ID or get from database
    # user_ids = get_user_ids()
    user_id = DEFAULT_USER_ID  # For simplicity, using a fixed user ID
    
    transactions = []
    current_id = 1
    order_count = 0

    estimated_orders = num_transactions // 4.5
    
    while len(transactions) < num_transactions:
        # Generate a new order with 2-7 items
        order_id = f"{order_count + 1}"  # Simple sequential order IDs
        order_date = generate_date(order_id, estimated_orders)
        order_items_count = random.randint(2, 7)  # 2-7 items per order
        
        # Create a timestamp for this order
        timestamp = datetime.datetime.strptime(order_date, "%Y-%m-%d")
        timestamp = timestamp.replace(hour=random.randint(9, 18), minute=random.randint(0, 59), second=random.randint(0, 59))
        timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + "+05:30"
        
        # Select random items for this order (without duplicates)
        order_items = random.sample(list(items.keys()), order_items_count)
        
        for item_name in order_items:
            item_data = items[item_name]
            quantity_value = random.choice(item_data["unit_options"])
            unit = item_data["unit"]
            
            # Calculate price based on quantity and unit price
            if unit == "gm":
                selling_price = int(quantity_value * item_data["price"])
            else:
                selling_price = int(quantity_value * item_data["price"])
            
            # Format quantity string
            quantity_str = format_quantity(quantity_value, unit)
            
            transaction = {
                "id": current_id,
                "UserId": user_id,
                "date": order_date,
                "item": item_name,
                "sellingPrice": str(selling_price),
                "createdAt": timestamp_str,
                "updatedAt": timestamp_str,
                "orderID": order_id,
                "quantity": quantity_str
            }
            
            transactions.append(transaction)
            current_id += 1
            
            # Break if we've reached the target number of transactions
            if len(transactions) >= num_transactions:
                break
        
        order_count += 1
    
    return transactions[:num_transactions]  # Ensure exactly num_transactions are returned

# Insert transactions into the database
def insert_transactions(transactions):
    try:
        # Prepare data for bulk insert
        values = [(
            t["UserId"], 
            t["date"], 
            t["item"], 
            t["sellingPrice"], 
            t["createdAt"], 
            t["updatedAt"], 
            t["orderID"], 
            t["quantity"]
        ) for t in transactions]
        
        # Bulk insert using execute_values
        execute_values(
            cursor,
            """
            INSERT INTO transactions 
            ("UserId", date, item, "sellingPrice", "createdAt", "updatedAt", "orderID", quantity) 
            VALUES %s
            """,
            values
        )
        
        conn.commit()
        print(f"Successfully inserted {len(transactions)} transactions!")
    except Exception as e:
        conn.rollback()
        print(f"Error inserting transactions: {e}")
        sys.exit(1)

# Main execution
if __name__ == "__main__":
    num_transactions = 300  # Default number of transactions to generate
    
    # Allow command-line argument to specify number of transactions
    if len(sys.argv) > 1:
        try:
            num_transactions = int(sys.argv[1])
        except ValueError:
            print("Invalid number of transactions. Using default value of 300.")
    
    print(f"Generating {num_transactions} random transactions...")
    transactions = generate_transactions(num_transactions)
    print(f"Generated {len(transactions)} transactions. Inserting into database...")
    insert_transactions(transactions)
    
    # Close database connection
    cursor.close()
    conn.close()
    print("Database connection closed.")