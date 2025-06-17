from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import json
import calendar

# Database connection
DATABASE_URL = "postgresql://postgres.evujabwwvgxmasemxjkz:Tony2056*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

def get_analytics_data(user_id):
    try:
        # Create database connection
        engine = create_engine(DATABASE_URL)
        
        # Calculate date range for last 6 months
        end_date = datetime.now()
        # Get the first day of current month
        current_month_start = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Get the first day 5 months ago
        start_date = (current_month_start - timedelta(days=1))
        start_date = start_date.replace(day=1)
        start_date = start_date - timedelta(days=150)
        
        with engine.connect() as connection:
            # Key Metrics Query - Total Revenue and Average Order Value
            key_metrics_query = text("""
                WITH order_totals AS (
                    SELECT "orderID", SUM("sellingPrice") as order_total
                    FROM transactions
                    WHERE "UserId" = :user_id
                    AND date >= :start_date
                    GROUP BY "orderID"
                )
                SELECT 
                    SUM(order_total) as total_revenue,
                    AVG(order_total) as avg_order_value
                FROM order_totals
            """)
            
            # Monthly Sales Query with all months included
            monthly_sales_query = text("""
                WITH RECURSIVE date_range AS (
                    SELECT date_trunc('month', CAST(:start_date AS timestamp)) as month
                    UNION ALL
                    SELECT date_trunc('month', month + interval '1 month')
                    FROM date_range
                    WHERE date_trunc('month', month + interval '1 month') <= date_trunc('month', CAST(:end_date AS timestamp))
                ),
                monthly_data AS (
                    SELECT 
                        date_trunc('month', date) as month,
                        SUM("sellingPrice") as sales,
                        SUM("sellingPrice" * 0.2) as profit
                    FROM transactions
                    WHERE "UserId" = :user_id
                    AND date >= :start_date
                    AND date <= :end_date
                    GROUP BY date_trunc('month', date)
                )
                SELECT 
                    to_char(dr.month, 'Mon') as month,
                    COALESCE(md.sales, 0) as sales,
                    COALESCE(md.profit, 0) as profit
                FROM date_range dr
                LEFT JOIN monthly_data md ON dr.month = md.month
                ORDER BY dr.month DESC
            """)
            
            # Inventory Performance Query with correct turnover rate and days on hand calculations
            inventory_query = text("""
                WITH monthly_inventory AS (
                    SELECT 
                        p."productID",
                        p."productName",
                        i."holdingQuantity" * i."unitPrice" as current_inventory_value,
                        SUM(t.quantity * t."sellingPrice") as goods_sold
                    FROM products p
                    JOIN inventories i ON p."productID" = i."productID"
                    LEFT JOIN transactions t ON p."productID" = t."productID"
                        AND t.date >= :start_date
                        AND t.date <= :end_date
                    WHERE p."UserId" = :user_id
                    GROUP BY p."productID", p."productName", i."holdingQuantity", i."unitPrice"
                )
                SELECT 
                    mi."productName" as name,
                    i."holdingQuantity" as stock,
                    CASE 
                        WHEN mi.current_inventory_value = 0 THEN 0
                        ELSE COALESCE(mi.goods_sold / NULLIF(mi.current_inventory_value, 0), 0)
                    END as turnover_rate,
                    CASE 
                        WHEN mi.goods_sold = 0 THEN 0
                        ELSE (mi.current_inventory_value / (mi.goods_sold / 180)) * 180
                    END as days_on_hand
                FROM monthly_inventory mi
                JOIN inventories i ON mi."productID" = i."productID"
                WHERE i."UserId" = :user_id
                ORDER BY turnover_rate DESC
            """)
            
            # Execute queries
            key_metrics_result = connection.execute(
                key_metrics_query, 
                {"user_id": user_id, "start_date": start_date}
            ).fetchone()
            
            monthly_sales_result = connection.execute(
                monthly_sales_query,
                {"user_id": user_id, "start_date": start_date, "end_date": end_date}
            ).fetchall()
            
            inventory_result = connection.execute(
                inventory_query,
                {"user_id": user_id, "start_date": start_date, "end_date": end_date}
            ).fetchall()
            
            # Format results
            analytics_data = {
                "keyMetrics": {
                    "totalRevenue": float(key_metrics_result[0] or 0),
                    "averageOrderValue": float(key_metrics_result[1] or 0)
                },
                "monthlySales": [
                    {
                        "month": row[0],
                        "sales": float(row[1] or 0),
                        "profit": float(row[2] or 0)
                    } for row in monthly_sales_result
                ],
                "inventoryPerformance": [
                    {
                        "name": row[0],
                        "stock": int(row[1] or 0),
                        "turnoverRate": float(row[2] or 0),
                        "daysOnHand": float(row[3] or 0)
                    } for row in inventory_result
                ]
            }
            
            return analytics_data
            
    except Exception as e:
        print(f"Error fetching analytics data: {e}")
        return None

# Example usage
def get_analytics_json(user_id):
    data = get_analytics_data(user_id)
    if data:
        return json.dumps(data, indent=2)
    return json.dumps({"error": "Failed to fetch analytics data"})

if __name__ == "__main__":
    print(get_analytics_json(1))