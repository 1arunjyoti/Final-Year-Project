from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
from dotenv import load_dotenv
from get_analytics import engine_creator, get_df, get_key_metrics, get_monthly_sales, get_inventory_insights

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

@app.route('/predictions', methods=['POST'])
def get_predictions():
    try:
        data = request.json
    except Exception as e:
        print("Error retrieving predictions:", e)
        return jsonify({"error": "An error occurred while processing the predictions"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=True)