from flask import Flask, request, jsonify, Response
from flask_cors import CORS 
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route('/analytics', methods=['POST'])
def get_analytics():
    try:
        data = request.json
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