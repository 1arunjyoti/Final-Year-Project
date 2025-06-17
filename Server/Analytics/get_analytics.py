import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta
import json

url = 'postgresql://postgres.evujabwwvgxmasemxjkz:Tony2056*@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'

def engine_creator(url):
    engine = create_engine(url)
    return engine

def get_df(engine):
    transactions_df = pd.read_sql('SELECT * FROM transactions', engine)
    inventories_df = pd.read_sql('SELECT * FROM inventories', engine)
    products_df = pd.read_sql('SELECT * FROM products', engine)
    return transactions_df, inventories_df, products_df

def get_key_metrics(transactions_df):
    # Ensure date column is in datetime format
    transactions_df['date'] = pd.to_datetime(transactions_df['date'])

    # Add revenue column
    transactions_df['revenue'] = transactions_df['quantity'] * transactions_df['sellingPrice']

    # Reference end date as latest transaction
    end_date = transactions_df['date'].max()

    # Define period cutoffs
    periods = {
        '6_months': end_date - timedelta(days=180),
        'quarter': end_date - timedelta(days=90),
        '30_days': end_date - timedelta(days=30)
    }

    # Initialize metrics dictionary
    key_metrics = {}

    for label, start_date in periods.items():
        period_tx = transactions_df[(transactions_df['date'] >= start_date) & (transactions_df['date'] <= end_date)]
        
        total_revenue = period_tx['revenue'].sum()
        order_count = period_tx['id'].nunique() if 'id' in period_tx.columns else len(period_tx)
        avg_order_value = total_revenue / order_count if order_count else 0

        key_metrics[label] = {
            'totalRevenue': round(total_revenue, 2),
            'averageOrderValue': round(avg_order_value, 2)
        }

    # Final JSON object
    json_output = json.dumps(key_metrics, indent=2)
    print(json_output)
    return key_metrics


def get_monthly_sales(transactions_df, inventories_df):
    # Ensure datetime
    transactions_df['date'] = pd.to_datetime(transactions_df['date'])

    # Get unit cost from inventories_df (one row per product)
    product_costs = inventories_df[['productID', 'unitPrice']].drop_duplicates('productID')

    # Merge cost price
    tx = transactions_df.merge(product_costs, on='productID', how='left')

    # Compute sales and profit
    tx['sales'] = tx['sellingPrice']
    tx['profit'] = tx['sellingPrice'] - tx['unitPrice'] * tx['quantity']

    # Filter last 6 months
    end_date = tx['date'].max()
    start_date = end_date - timedelta(days=180)
    tx_6m = tx[(tx['date'] >= start_date) & (tx['date'] <= end_date)].copy()

    # Create 'month_date' (first day of the month) for sorting
    tx_6m['month_date'] = tx_6m['date'].values.astype('datetime64[M]')

    # Create readable month name
    tx_6m['month'] = tx_6m['month_date'].dt.strftime('%B %Y')

    # Group and aggregate
    monthly_metrics = tx_6m.groupby(['month_date', 'month']).agg({
        'sales': 'sum',
        'profit': 'sum'
    }).reset_index()

    # Round and sort
    monthly_metrics['sales'] = monthly_metrics['sales'].round(2)
    monthly_metrics['profit'] = monthly_metrics['profit'].round(2)
    monthly_metrics = monthly_metrics.sort_values(by='month_date')

    # Final output
    final_output = monthly_metrics[['month', 'sales', 'profit']].to_dict(orient='records')
    json_output = json.dumps(final_output, indent=2)
    print(json_output)
    return final_output


def get_inventory_insights(transactions_df, inventories_df, products_df):
    total_bought = inventories_df.groupby('productID')['holdingQuantity'].sum()
    total_sold = transactions_df.groupby('productID')['quantity'].sum()

    # Join both series into a single DataFrame
    stock_df = pd.DataFrame({
        'totalBought': total_bought,
        'totalSold': total_sold
    }).fillna(0)

    # Calculate current stock
    stock_df['currentStock'] = stock_df['totalBought'] - stock_df['totalSold']

    # Reset index if needed
    stock_df = stock_df.reset_index()

    transactions_df['date'] = pd.to_datetime(transactions_df['date'])
    inventories_df['stockingDate'] = pd.to_datetime(inventories_df['stockingDate'])

    end_date = transactions_df['date'].max()
    start_date = end_date - timedelta(days=180)

    # Filter both dataframes
    recent_sales = transactions_df[(transactions_df['date'] >= start_date) & 
                                (transactions_df['date'] <= end_date)]

    recent_inventory = inventories_df[(inventories_df['stockingDate'] <= end_date)]

    # Total sold in 180 days
    sold_180 = recent_sales.groupby('productID')['quantity'].sum()

    # Average inventory over the period: one way is to take average of inventory held per product
    avg_inventory = recent_inventory.groupby('productID')['holdingQuantity'].mean()

    # Combine into one DataFrame
    turnover_df = pd.DataFrame({
        'totalSold_180': sold_180,
        'avgInventory': avg_inventory
    }).fillna(0)

    # Calculate Turnover Rate and Days on Hand
    turnover_df['turnoverRate'] = turnover_df['totalSold_180'] / turnover_df['avgInventory'].replace(0, pd.NA)
    turnover_df['daysOnHand'] = 180 / turnover_df['turnoverRate'].replace(0, pd.NA)

    turnover_df = turnover_df.reset_index()

    turnover_df['stock'] = stock_df['currentStock']

    # Round relevant columns to nearest integer
    turnover_df[['totalSold_180', 'avgInventory', 'daysOnHand', 'stock']] = turnover_df[[
        'totalSold_180', 'avgInventory', 'daysOnHand', 'stock'
    ]].round(0).astype('Int64')  # Use 'Int64' for nullable integer support
    turnover_df['turnoverRate'] = turnover_df['turnoverRate'].round(2)

    # Assume you have a product table DataFrame: products_df with 'productID', 'productName'
    final_df = turnover_df.merge(products_df[['productID', 'productName']], on='productID', how='left')

    # Reorder columns for readability
    final_df = final_df[['productName', 'productID', 'stock', 'turnoverRate', 'daysOnHand']]

    final_df = final_df.sort_values(by='turnoverRate', ascending=False).reset_index(drop=True)

    output_json = final_df.to_dict(orient='records')
    print(json.dumps(output_json, indent=2))
    return output_json