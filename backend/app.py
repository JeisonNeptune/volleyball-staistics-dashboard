from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
import pandas as pd
import os
print("🚀 Flask is starting...")
app = Flask(__name__)
CORS(app)

DATA_DIR = './data/team_stats'

@app.route('/api/stats')
def get_stat_names():
    files = os.listdir(DATA_DIR)
    csv_files = [f for f in files if f.endswith('.csv')]
    names = [os.path.splitext(f)[0] for f in csv_files]
    return jsonify(names)

@app.route('/api/stat/<name>')
def get_stat_data(name):
    filename = f"{name}.csv"
    filepath = os.path.join(DATA_DIR, filename)

    try:
        df = pd.read_csv(filepath)

        # Determine correct column to graph
        if name in ["Hitting_Percentage", "Win_Percentage"]:
            value_column = "Value"
        else:
            value_column = "Per Set"  # fallback default

        return jsonify({
            "data": df.to_dict(orient='records'),
            "value_column": value_column
        })

    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
if __name__ == '__main__':
    app.run(debug=True)

    # .\env\Scripts\activate
    # python app.py


    #npm start