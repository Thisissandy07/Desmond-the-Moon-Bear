from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)
DB_PATH = 'scores.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scores', methods=['GET'])
def get_scores():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    scores = [{'name': r[0], 'score': int(r[1]), 'date': r[2][:10]} for r in rows]
    return jsonify(scores)

@app.route('/api/scores', methods=['POST'])
def post_score():
    data = request.get_json()
    name = data.get('name', 'Anonymous').strip() or 'Anonymous'
    score = int(data.get('score', 0))
    if len(name) > 20:
        name = name[:20]
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO scores (name, score) VALUES (?, ?)', (name, score))
    conn.commit()
    conn.close()
    return jsonify({'status': 'ok', 'name': name, 'score': score})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
