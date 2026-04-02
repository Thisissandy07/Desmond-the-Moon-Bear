from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# ── Database setup ────────────────────────────────────────────────────────────
# Uses PostgreSQL on Render (via DATABASE_URL env var)
# Falls back to SQLite for local development
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    import psycopg2
    import psycopg2.extras
    USE_POSTGRES = True
    # Render gives 'postgres://' but psycopg2 needs 'postgresql://'
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
else:
    import sqlite3
    USE_POSTGRES = False
    DB_PATH = os.path.join(os.path.dirname(__file__), 'scores.db')


def get_conn():
    if USE_POSTGRES:
        return psycopg2.connect(DATABASE_URL)
    else:
        return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_conn()
    c = conn.cursor()
    if USE_POSTGRES:
        c.execute('''
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    else:
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


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        conn = get_conn()
        c = conn.cursor()
        c.execute('SELECT name, score, created_at FROM scores ORDER BY score DESC LIMIT 10')
        rows = c.fetchall()
        conn.close()
        scores = [{'name': r[0], 'score': int(r[1]), 'date': str(r[2])[:10]} for r in rows]
        return jsonify(scores)
    except Exception as e:
        print(f'GET /api/scores error: {e}')
        return jsonify([])


@app.route('/api/scores', methods=['POST'])
def post_score():
    try:
        data  = request.get_json()
        name  = (data.get('name', 'Anonymous') or 'Anonymous').strip()[:20]
        score = int(data.get('score', 0))
        conn  = get_conn()
        c     = conn.cursor()
        if USE_POSTGRES:
            c.execute('INSERT INTO scores (name, score) VALUES (%s, %s)', (name, score))
        else:
            c.execute('INSERT INTO scores (name, score) VALUES (?, ?)', (name, score))
        conn.commit()
        conn.close()
        return jsonify({'status': 'ok', 'name': name, 'score': score})
    except Exception as e:
        print(f'POST /api/scores error: {e}')
        return jsonify({'status': 'error'}), 500


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=not USE_POSTGRES)
