from table_log import result_table_log
from flask import Flask, request, jsonify, Response
from flask_cors import CORS 
import numpy as np
import cv2
import os

app = Flask(__name__)
CORS(app)

@app.route('/ocr', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided (field name should be 'image')"}), 400
    
    image_file = request.files['image']

    if image_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        img_bytes = image_file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Could not decode image. Invalid image format?"}), 400
        
        ocr_result = result_table_log(img)
        result_json = ocr_result.to_json()
        print("Extracted OCR Data:", result_json)  # Print the extracted data in the console
        if result_json is None or result_json == '{}' or len(result_json) == 0:
            return jsonify({"error": "No text found in the image"}), 400
        return result_json, 200
    
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": "An error occurred while processing the image"}), 500
    
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5003))
    app.run(host='0.0.0.0', port=port, debug=True)