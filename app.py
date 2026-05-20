from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = "change-moi-009"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class Paste(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    text = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(80), nullable=False)
    views = db.Column(db.Integer, default=0)
    date = db.Column(db.String(30), nullable=False)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Remplis tous les champs"})

    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Ce compte existe déjà"})

    user = User(
        username=username,
        password=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "message": "Compte créé avec succès"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"success": False, "message": "identifiant ou mot de passe incorrect"})

    session["user"] = username
    return jsonify({"success": True, "username": username})


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True})


@app.route("/pastes", methods=["GET"])
def get_pastes():
    search = request.args.get("search", "").lower()

    pastes = Paste.query.order_by(Paste.id.desc()).all()

    result = []
    for paste in pastes:
        if search in paste.title.lower() or search in paste.text.lower() or search in paste.author.lower():
            result.append({
                "id": paste.id,
                "title": paste.title,
                "text": paste.text,
                "author": paste.author,
                "views": paste.views,
                "date": paste.date
            })

    return jsonify(result)


@app.route("/paste", methods=["POST"])
def create_paste():
    if "user" not in session:
        return jsonify({"success": False, "message": "Non connecté"})

    data = request.json
    title = data.get("title")
    text = data.get("text")

    if not title or not text:
        return jsonify({"success": False, "message": "Ajoute un titre et un texte"})

    paste = Paste(
        title=title,
        text=text,
        author=session["user"],
        views=0,
        date=datetime.now().strftime("%d/%m/%Y")
    )

    db.session.add(paste)
    db.session.commit()

    return jsonify({"success": True})


@app.route("/paste/<int:paste_id>", methods=["GET"])
def open_paste(paste_id):
    paste = Paste.query.get_or_404(paste_id)
    paste.views += 1
    db.session.commit()

    return jsonify({
        "id": paste.id,
        "title": paste.title,
        "text": paste.text,
        "author": paste.author,
        "views": paste.views,
        "date": paste.date
    })


@app.route("/paste/<int:paste_id>", methods=["DELETE"])
def delete_paste(paste_id):
    if "user" not in session:
        return jsonify({"success": False, "message": "Non connecté"})

    paste = Paste.query.get_or_404(paste_id)
    db.session.delete(paste)
    db.session.commit()

    return jsonify({"success": True})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

   app.run(debug=True, port=5000, host="0.0.0.0")
