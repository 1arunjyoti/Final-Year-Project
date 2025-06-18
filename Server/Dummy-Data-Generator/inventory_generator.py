from itertools import product
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import random

DATABASE_URL = "postgresql://postgres.evujabwwvgxmasemxjkz:Tony2056*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def get_current_stock(connection, product_id):
    query = text("""
        SELECT 
            COALESCE(SUM(i."holdingQuantity"), 0) as total_purchased,
            COALESCE(SUM(t.quantity), 0) as total_sold
        FROM products p
        LEFT JOIN inventories i ON p."productID" = i."productID"
        LEFT JOIN transactions t ON p."productID" = t."productID"
        WHERE p."productID" = :product_id
        GROUP BY p."productID"
    """)
    
    result = connection.execute(query, {"product_id": product_id}).fetchone()
    if result:
        return result[0] - result[1]
    return 0

def predict_monthly_sales(connection, product_id, target_month):
    # Query to get average monthly sales for the past 3 months
    query = text("""
        SELECT COALESCE(SUM(quantity), 0) as total_quantity
        FROM transactions
        WHERE "productID" = :product_id
        AND date >= :start_date
        AND date < :end_date
    """)
    
    # Calculate date range for past 3 months
    end_date = target_month
    start_date = end_date - timedelta(days=90)
    
    result = connection.execute(query, {
        "product_id": product_id,
        "start_date": start_date,
        "end_date": end_date
    }).fetchone()
    
    # Add 20% buffer to the prediction
    return (float(result[0]) / 3) * 1.2 if result[0] else 50  # Default to 50 if no history

def should_restock(connection, product_id, current_date):
    current_stock = get_current_stock(connection, product_id)
    predicted_sales = predict_monthly_sales(connection, product_id, current_date)
    
    # Restock if:
    # 1. Current stock is below 50 units (minimum threshold)
    # 2. Current stock won't cover predicted monthly sales
    # 3. Current stock is below 2x predicted monthly sales (safety stock)
    return current_stock < 50 or current_stock < predicted_sales or current_stock < (predicted_sales * 2)

def calculate_restock_quantity(current_stock, predicted_sales):
    # Base quantity covers 3 months of predicted sales plus safety stock
    target_stock = (predicted_sales * 3) * 1.2  # 20% safety stock
    restock_quantity = max(target_stock - current_stock, 50)
    return min(int(restock_quantity), 500)  # Cap at 500 units

def generate_inventory_data():
    
        engine = create_engine(DATABASE_URL)
        
        # Product details
        products = [
    (1, "Basmati rice", 65.00), # Lower end for wholesale Sella Basmati
    (2, "Red lentils", 90.00),  # Lower end for Masoor Dal
    (3, "Mustard oil", 150.00), # Lower end for bulk mustard oil
    (4, "Salt", 20.00),         # Lower end for common salt
    (5, "Atta", 45.00),         # Lower end for wholesale atta
    (6, "Maida", 40.00),        # Lower end for wholesale maida
    (7, "Sugar", 40.00),        # Lower end for wholesale sugar
    (8, "Turmeric powder", 150.00), # Lower end for bulk turmeric powder
    (9, "Tea leaves", 250.00),  # Lower end for common tea leaves
    (10, "Groundnut oil", 180.00), # Lower end for bulk groundnut oil
    (11, "Jaggery", 60.00),     # Lower end for wholesale jaggery
    (12, "Red chilli powder", 200.00), # Lower end for bulk chilli powder
    (13, "Cumin seeds", 170.00), # Lower end for bulk cumin seeds
    (14, "Black pepper", 350.00), # Lower end for bulk black pepper
    (15, "Coriander powder", 110.00), # Lower end for bulk coriander powder
    (16, "Cardamom", 2300.00),  # Lower end for green cardamom (smaller sizes/grades)
    (17, "Cloves", 750.00),     # Lower end for bulk cloves
    (18, "Green gram", 100.00), # Lower end for Moong (whole)
    (19, "Chickpeas", 65.00),   # Lower end for Kabuli Chana (white chickpeas)
    (20, "Bay leaves", 50.00),  # Lower end for bulk bay leaves
    (21, "Dry red chilli", 200.00), # Lower end for bulk dry red chillies
    (22, "Moong dal", 100.00),  # Lower end for Moong Dal (split)
    (23, "Masoor dal", 90.00),  # Lower end for Masoor Dal
    (24, "Refined oil", 145.00), # Lower end for bulk refined oil
    (25, "Sunflower oil", 160.00), # Lower end for bulk sunflower oil
    (26, "Besan", 55.00),       # Lower end for wholesale besan
    (27, "Toor dal", 120.00),   # Lower end for Toor Dal
    (28, "Urad dal", 100.00),   # Lower end for Urad Dal
    (29, "Poha", 60.00),        # Lower end for thick poha
    (30, "Sooji", 40.00),       # Lower end for wholesale sooji
    (31, "Ghee", 500.00),       # Lower end for bulk/loose ghee (approx)
    (32, "Coconut oil", 200.00), # Lower end for bulk coconut oil
    (33, "Tamarind", 100.00),   # Lower end for bulk tamarind
    (34, "Fennel seeds", 150.00), # Lower end for bulk fennel seeds
    (35, "Fenugreek seeds", 80.00), # Lower end for bulk fenugreek seeds
    (36, "Asafoetida", 60.00),  # Lower end for compounded asafoetida (small packs)
    (37, "Cashew nuts", 600.00), # Lower end for broken/smaller grade cashews
    (38, "Almonds", 550.00),    # Lower end for bulk almonds (e.g., California Nonpareil)
    (39, "Raisins", 200.00),    # Lower end for common raisins
    (40, "Peanuts", 80.00),     # Lower end for raw peanuts
    (41, "Chana dal", 60.00),   # Lower end for Chana Dal
    (42, "Rajma", 100.00),      # Lower end for common rajma varieties
    (43, "Sago", 70.00),        # Lower end for medium sago
    (44, "Vermicelli", 50.00),  # Lower end for common vermicelli
    (45, "Baking soda", 22.00), # Lower end for bulk baking soda
    (46, "Baking powder", 58.00), # Lower end for bulk baking powder
    (47, "Custard powder", 200.00), # Price adjusted to a per kg estimate based on common pack sizes
    (48, "Jelly crystals", 150.00), # Lower end for bulk jelly crystals
    (49, "Honey", 300.00),      # Lower end for bulk/non-branded honey
    (50, "Jam", 150.00),        # Lower end for bulk jam
    (51, "Pickle", 100.00),     # Lower end for bulk/common pickle
    (52, "Papad", 100.00)       # Lower end for common papad varieties
]
        
        # Define date range (June 2023 to current)
        start_date = datetime(2023, 6, 1)
        end_date = datetime.now().replace(day=1)
        
        with engine.connect() as connection:
            # Initial stocking in June 2023
            # for product_id, productName, unit_price in products:
            #     # Random initial stock between 100-500 units
            #     quantity = random.randint(100, 500)
                
            #     insert_query = text("""
            #         INSERT INTO inventories ("UserId", "productID", "productName",  "unitPrice", "holdingQuantity", "stockingDate")
            #         VALUES (1, :product_id, :productName, :unit_price, :quantity, :date)
            #     """)
                
            #     connection.execute(insert_query, {
            #         "product_id": product_id,
            #         "productName": productName,
            #         "quantity": quantity,
            #         "unit_price": unit_price,
            #         "date": start_date
            #     })
            
            # Monthly restocking
            current_date = start_date + timedelta(days=31)
            mon = 1
            while current_date <= end_date:
                print("I am in month ", mon)
                mon += 1
                for product_id, productName, base_price in products:
                    # Check if product needs restocking
                    if should_restock(connection, product_id, current_date):
                        current_stock = get_current_stock(connection, product_id)
                        predicted_sales = predict_monthly_sales(connection, product_id, current_date)
                        quantity = calculate_restock_quantity(current_stock, predicted_sales)
                        
                        # Adjust unit price with small random variation
                        # unit_price = base_price * random.uniform(0.95, 1.05)
                        
                        insert_query = text("""
                            INSERT INTO inventories ("UserId", "productID", "productName",  "unitPrice", "holdingQuantity", "stockingDate")
                            VALUES (1, :product_id, :productName, :unit_price, :quantity, :date)
                            """)
                        
                        connection.execute(insert_query, {
                            "product_id": product_id,
                            "productName": productName,
                            "quantity": quantity,
                            "unit_price": round(base_price, 2),
                            "date": current_date
                        })
                
                current_date += timedelta(days=31)
                print(current_date)
            
            connection.commit()
            print("Inventory data generated successfully!")

if __name__ == "__main__":
    generate_inventory_data()