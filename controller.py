from flask import (
    Flask,
    url_for, flash, request,
    render_template, redirect,
    make_response,jsonify
)

from flask_login import (
    LoginManager, UserMixin,
    login_required,
    current_user,
    login_user, logout_user
)

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from flask_socketio import (
    SocketIO,
    emit,
    join_room,leave_room,close_room,rooms
)

from sqlalchemy import and_, or_ 

#標準ライブラリ
import json
import os
import pathlib
import urllib
import datetime

#Flask
app = Flask(__name__)
app.config["SECRET_KEY"] = "f4Pjp3UgJa51"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///web_game.db"

#Flask-Login
login_manager = LoginManager()
login_manager.login_view = "login"
login_manager.init_app(app)

#Flask-SQLAlchemy
db = SQLAlchemy()
db.init_app(app)
migrate = Migrate(app, db)

#Flask-SocketIO
socketio = SocketIO(app)

@app.route('/', methods=['GET', 'POST'])
@login_required
def index():
  return render_template("index.html")

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username).first()
        if username == "":
            flash("ユーザ名を入力してください")
            return redirect(url_for("index"))
        
        if user is None:
            user = User(
                username=username,
                password=password,
                email=""
            )
            db.session.add(user)
            db.session.commit()
            login_user(user)
            return redirect(url_for("index"))
        elif user.password != password:
            flash("既に使われている名前であるか、パスワードがちがいます。")
        else:
            login_user(user)
            return redirect(url_for("index"))
    return render_template("login.html")

@app.route('/notice', methods=['GET','POST'])
@login_required
def notice():
    if request.method == "POST":
        title          = request.form["title"]
        content        = request.form["content"]
        start_datetime = datetime.datetime.strptime(request.form["start_datetime"],'%Y-%m-%dT%H:%M')
        end_datetime   = datetime.datetime.strptime(request.form["end_datetime"],'%Y-%m-%dT%H:%M')
        notice = Notice(
            title = title,
            content = content,
            start_datetime = start_datetime,
            end_datetime = end_datetime
        )
        db.session.add(notice)
        db.session.commit()
    notices = Notice.query.all()
    return render_template("notice.html",notices=notices)

@app.route('/notice/<id>/delete', methods=['POST'])
@login_required
def notice_delete(id):
    notice = Notice.query.filter_by(id=id).first()
    db.session.delete(notice)
    db.session.commit()
    return redirect(url_for("notice"))

@app.route('/notice/load', methods=['POST'])
@login_required
def notice_load():
    notices = Notice.active_notices()
    return jsonify(notices)

@app.route('/logout', methods=['GET','POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

@socketio.on("connect")
def connect_handler():
    emit("client_echo",{"msg":"server connected!","user_name":current_user.username})

@socketio.on("server_echo")
@login_required
def server_echo(data):
    print(data["msg"])

@socketio.on("join")
@login_required
def join(data):
    print(data)
    join_room(data["room"])
    emit("client_echo",{"msg":current_user.username + " join room : " + data["room"],"user_name":current_user.username},to=data["room"])

@socketio.on("send_room")
@login_required
def send_room(data):
    print(data)
    emit("client_echo",{"msg":data["msg"],"user_name":current_user.username},to=data["room"])

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(id=user_id).first()

class User(db.Model, UserMixin):
    __tablename__ = "users"
    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String,  unique=True, nullable=False)
    password = db.Column(db.String,  nullable=False)
    email    = db.Column(db.String,  default="")
    auth     = db.Column(db.Integer, default=0)
    grade    = db.Column(db.Integer, default=0)

class GameInfo(db.Model):
    __tablename__ = "gameinfo"
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.Integer, unique=True, nullable=False)


class Notice(db.Model):
    __tablename__ = "notices"
    id =db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, default="タイトル")
    content = db.Column(db.Text, default="内容")
    start_datetime = db.Column(db.DateTime, default=datetime.datetime.now())
    end_datetime = db.Column(db.DateTime, default=datetime.datetime.now())

    def active_notices():
        now = datetime.datetime.now()
        notices = Notice.query.filter(
            and_(Notice.start_datetime <= now, Notice.end_datetime >= now)
        ).all()

        temp = []
        for notice in notices:
            temp.append(
                {
                    "title":notice.title,
                    "content":notice.content,
                    "start_datetime":str(notice.start_datetime),
                    "end_datetime":str(notice.end_datetime)
                }
            )
        return temp
    
if __name__ == "__main__":
    #SSL化する（HTTPS）
    #証明書パス,秘密鍵のパス
    #sc = ("openssl/server.crt","openssl/server.key") 
    #オプションに指定する ssl_context=sc
    socketio.run(app,host="0.0.0.0", port="55555")
    #app.run(host="0.0.0.0", port="55555", threaded=True)
