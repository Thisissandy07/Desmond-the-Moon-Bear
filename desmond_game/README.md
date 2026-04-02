# Desmond the Moon Bear — Flask Web Game

A browser-playable port of the Pygame game, built with Flask + JavaScript Canvas API.

## Project Structure

```
desmond_game/
├── app.py                  # Flask backend + score API
├── requirements.txt
├── scores.db               # SQLite DB (auto-created on first run)
├── static/
│   ├── css/style.css
│   ├── js/game.js
│   └── images/             
│       ├── BACKGROUND.png
│       ├── desmond_idle.png
│       ├── rock1.png
│       ├── rock2.png
│       ├── smallRock3.png
│       ├── small Rock4.png
│       ├── LargeRock5.png
│       ├── walk img/
│       │   └── walk1.png ... walk6.png
│       ├── jump img/
│       │   └── jump1.png ... jump8.png
│       ├── SHIPS/
│       │   └── ship1.png ... ship3.png
│       └── CLOUDS/
│           └── clouds1.png, clouds2.png
└── templates/
    └── index.html
```

## Setup & Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Add your image assets to static/images/ (see structure above)

# 3. Run the server
python app.py

# 4. Open in browser
# http://localhost:5000
```

## API Endpoints

| Method | Route         | Description              |
|--------|---------------|--------------------------|
| GET    | `/`           | Serves the game page     |
| GET    | `/api/scores` | Top 10 scores (JSON)     |
| POST   | `/api/scores` | Submit a score           |

### POST /api/scores
```json
{ "name": "Player", "score": 1234 }
```
