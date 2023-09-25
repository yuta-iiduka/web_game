py -m venv --clear .venv
.venv\Scripts\activate
pip install -r requirements.txt

#windows
set FLASK_APP=controller.py
#linux
$FLASK_APP=controller.py

py -m flask db init
flask db migrate
flask db upgrade

cd C:\Users\aaa\OneDrive\ドキュメント\学習用\MyApp\web_game_sample
.venv\Scripts\activate
py controller