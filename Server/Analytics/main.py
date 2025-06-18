from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
from get_analytics import engine_creator, get_df, get_key_metrics, get_monthly_sales, get_inventory_insights, get_stock_records, get_top_selling_items, get_total_inventory
from get_predictions import get_connection, get_transaction_data, forecast_sales, visualize

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        url = os.getenv('DATABASE_URL')
        engine = engine_creator(url)
        transactions_df, inventories_df, products_df = get_df(engine)
        key_metrics = get_key_metrics(transactions_df)
        monthly_sales = get_monthly_sales(transactions_df, inventories_df)
        inventory_insights = get_inventory_insights(transactions_df, inventories_df, products_df)
        insights = {
            'key_metrics': key_metrics,
            'monthly_sales': monthly_sales,
            'inventory_insights': inventory_insights
        }
        print(jsonify(insights))
        return jsonify(insights)

    except Exception as e:
        print("Error retrieving analytics:", e)
        return jsonify({"error": "An error occurred while processing the analytics"}), 500

@app.route('/dashboard', methods=['GET'])
def get_dashboard():
    # try:
    url = os.getenv('DATABASE_URL')
    engine = engine_creator(url)
    transactions_df, inventories_df, products_df = get_df(engine)
    key_metrics = get_key_metrics(transactions_df)
    stock_records, _ = get_stock_records(transactions_df, inventories_df, products_df)
    top_selling_items = get_top_selling_items(transactions_df, products_df)
    total_inventory_value = get_total_inventory(inventories_df)
    dashboard = {
        'key_metrics': key_metrics,
        'stock_records': stock_records,
        'top_selling_items': top_selling_items,
        'total_inventory_value': total_inventory_value
    }
    print(jsonify(dashboard))
    return jsonify(dashboard)
    # except Exception as e:
    #     print("Error retrieving analytics:", e)
    #     return jsonify({"error": "An error occurred while processing the analytics"}), 500

@app.route('/predictions', methods=['GET'])
def get_forecast():
    url = os.getenv('DATABASE_URL')
    conn = get_connection(url)
    df = get_transaction_data(conn)
    # visualize(df)
    result = forecast_sales(df)
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=True)