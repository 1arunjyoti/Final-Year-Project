from flask import Blueprint, jsonify
from app.db import get_connection
from app.forecast import get_transaction_data, forecast_sales, visualize

routes = Blueprint('routes', __name__)

@routes.route('/forecast', methods=['GET'])
def get_forecast():
    conn = get_connection()
    df = get_transaction_data(conn)
    visualize(df)
    result = forecast_sales(df)
    return jsonify(result)
