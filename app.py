
import os
import sqlite3

from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "dev-only-change-this-secret-before-deployment"
)

DATABASE = os.path.join(app.root_path, "saferoute.db")


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_db_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )
        """)


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to continue.", "error")
            return redirect(url_for("home"))
        return view(*args, **kwargs)
    return wrapped_view


@app.route("/")
def home():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not name or not email or not password or not confirm_password:
            flash("Please fill in all fields.", "error")
            return render_template("register.html")

        if len(password) < 8:
            flash("Password must be at least 8 characters.", "error")
            return render_template("register.html")

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template("register.html")

        try:
            with get_db_connection() as connection:
                connection.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                    (name, email, generate_password_hash(password))
                )
        except sqlite3.IntegrityError:
            flash("This email is already registered.", "error")
            return render_template("register.html")

        flash("Account created! Please log in.", "success")
        return redirect(url_for("home"))

    return render_template("register.html")


@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    with get_db_connection() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        flash("Incorrect email or password.", "error")
        return redirect(url_for("home"))

    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return redirect(url_for("dashboard"))


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template(
        "dashboard.html",
        user_name=session.get("user_name", "User")
    )

@app.route("/map")
@login_required
def evacuation_map():
    return render_template("map.html")

@app.route("/chatbot")
@login_required
def chatbot():
    return render_template("chatbot.html")


@app.route("/chatbot/reply", methods=["POST"])
@login_required
def chatbot_reply():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip().lower()

    if not message:
        return jsonify({
            "reply": "Please enter a question."
        }), 400

    if len(message) > 1000:
        return jsonify({
            "reply": "Please keep your question under 1000 characters."
        }), 400

    # Emergency keyword detection
    urgent_keywords = [
        "trapped", "can't escape", "cannot escape",
        "people injured", "someone is injured",
        "building collapsing", "person drowning"
    ]

    if any(keyword in message for keyword in urgent_keywords):
        reply = (
            "If someone is in immediate danger, contact emergency "
            "services now. In India, dial 112. Give responders your "
            "exact location and describe the danger. Avoid entering "
            "floodwater, unstable buildings, or other hazardous areas "
            "to attempt a rescue. Follow instructions from emergency "
            "personnel."
        )

    elif any(word in message for word in [
        "hello", "hi", "hey"
    ]):
        reply = (
            "Hello! I'm the SafeRoute emergency assistant. "
            "You can ask me about flood safety, fire safety, "
            "earthquakes, emergency kits, or evacuation preparation."
        )

    elif any(word in message for word in [
        "flood", "flooding", "heavy rain"
    ]):
        reply = (
            "FLOOD SAFETY\n\n"
            "1. Move to higher ground when flooding threatens.\n"
            "2. Never walk, swim, or drive through floodwater.\n"
            "3. Stay away from electrical equipment in wet areas.\n"
            "4. Take essential medicines, drinking water, and your phone "
            "if you can leave safely.\n"
            "5. Follow official evacuation instructions.\n\n"
            "Do not use this chatbot or its map as confirmation that "
            "a road or shelter is safe."
        )

    elif any(word in message for word in [
        "earthquake", "tremor", "shaking"
    ]):
        reply = (
            "EARTHQUAKE SAFETY\n\n"
            "1. Drop down, take cover under a sturdy table, and hold on.\n"
            "2. Protect your head and neck.\n"
            "3. Stay away from windows and objects that may fall.\n"
            "4. If outdoors, move away from buildings, trees, and power lines.\n"
            "5. After shaking stops, watch for aftershocks and follow "
            "official instructions."
        )

    elif any(word in message for word in [
        "fire", "smoke", "burning"
    ]):
        reply = (
            "FIRE SAFETY\n\n"
            "1. Leave the building immediately if there is a fire.\n"
            "2. Use stairs, not elevators.\n"
            "3. Stay low if smoke is present and avoid breathing it.\n"
            "4. Do not re-enter the building.\n"
            "5. Call local emergency services from a safe location.\n\n"
            "If your clothing catches fire: stop, drop, and roll."
        )

    elif any(word in message for word in [
        "emergency kit", "emergency bag",
        "survival kit", "supplies"
    ]):
        reply = (
            "EMERGENCY KIT CHECKLIST\n\n"
            "• Drinking water and non-perishable food\n"
            "• First-aid supplies and necessary medicines\n"
            "• Torch and spare batteries\n"
            "• Fully charged phone and power bank\n"
            "• Important documents in a waterproof bag\n"
            "• Whistle, hygiene items, and some cash\n"
            "• Essential supplies for children, older adults, and pets\n\n"
            "Adjust the kit for your family's needs and local hazards."
        )

    elif any(word in message for word in [
        "evacuate", "evacuation", "leave my home",
        "safe route", "escape route"
    ]):
        reply = (
            "EVACUATION PREPARATION\n\n"
            "1. Follow evacuation orders from local authorities.\n"
            "2. Identify an officially designated shelter if available.\n"
            "3. Carry essential medicines, water, and your phone.\n"
            "4. Tell a trusted person where you are going.\n"
            "5. Avoid reported hazards and obey road closures.\n\n"
            "In SafeRoute AI, select your starting point, mark a reported "
            "disaster, and choose a destination on the map. The prototype "
            "route is not verified as safe; confirm conditions with "
            "official sources."
        )

    elif any(word in message for word in [
        "landslide", "mudslide"
    ]):
        reply = (
            "LANDSLIDE SAFETY\n\n"
            "1. Leave the path of a landslide if you can do so safely.\n"
            "2. Watch for unusual ground movement, falling rocks, or "
            "sudden changes in water flow.\n"
            "3. Stay away from slopes and areas authorities have closed.\n"
            "4. Do not cross an active landslide area.\n"
            "5. Follow local evacuation warnings and emergency guidance."
        )

    elif any(word in message for word in [
        "cyclone", "hurricane", "storm", "strong wind"
    ]):
        reply = (
            "CYCLONE AND STORM SAFETY\n\n"
            "1. Follow official weather alerts and evacuation orders.\n"
            "2. Shelter in a sturdy building away from windows.\n"
            "3. Secure loose outdoor objects only if it is safe to do so.\n"
            "4. Stay away from fallen power lines and floodwater.\n"
            "5. Do not go outside until authorities say it is safe."
        )

    elif any(word in message for word in [
        "help", "what can you do", "topics", "options"
    ]):
        reply = (
            "I can provide general guidance about:\n\n"
            "• Flood safety\n"
            "• Earthquake safety\n"
            "• Fire safety\n"
            "• Cyclones and storms\n"
            "• Landslides\n"
            "• Emergency kits\n"
            "• Evacuation preparation\n\n"
            "Try asking a specific question, such as "
            "'What should I do during a flood?'"
        )

    else:
        reply = (
            "I don't have a specific prepared answer for that question yet. "
            "Try asking about floods, earthquakes, fires, cyclones, "
            "landslides, emergency kits, or evacuation preparation. "
            "For an immediate emergency, contact local emergency services "
            "and follow official instructions."
        )

    return jsonify({"reply": reply})
@app.route("/emergency")
@login_required
def emergency():
    return render_template("emergency.html")

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("home"))


initialize_database()

if __name__ == "__main__":
    app.run(debug=True)
