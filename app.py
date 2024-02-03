from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__, static_url_path='/static')
app.secret_key = 'your_secret_key'

app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

# MongoDB 클라이언트 설정
client = MongoClient('mongodb+srv://moondy2209:비밀번호@cluster0.t0cskbu.mongodb.net/?retryWrites=true&w=majority')
db = client.dbjungle

@app.route('/')
def home():
    # 로그인 상태 확인
    if 'userid' in session:
        return redirect(url_for('get_todos'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        userid = request.form.get('userid').strip()
        username = request.form.get('username').strip()
        password = request.form.get('password')

        if not re.match(r'^[a-zA-Z0-9!@#$%^&*]{6,12}$', userid) or \
           not re.match(r'^.{6,}$', password) or \
           not re.match(r'^[가-힣a-zA-Z0-9]{1,15}$', username):
            return jsonify({'result': 'fail', 'msg': '잘못된 입력 형식입니다.'})

        if db.users.find_one({'userid': userid}):
            return jsonify({'result': 'fail', 'msg': '이미 존재하는 사용자 ID입니다.'})

        hashed_password = generate_password_hash(password)
        db.users.insert_one({'userid': userid, 'username': username, 'password': hashed_password})
        return jsonify({'result': 'success', 'msg': '회원가입 성공!'})
    else:
        return render_template('register.html')

@app.route('/check_userid', methods=['POST'])
def check_userid():
    userid = request.form.get('userid').strip()
    user = db.users.find_one({'userid': userid})
    return jsonify({'isAvailable': not bool(user)})

@app.route('/login', methods=['POST'])
def login():
    userid = request.form.get('userid')
    password = request.form.get('password')
    user = db.users.find_one({'userid': userid})
    
    if user and check_password_hash(user['password'], password):
        session['userid'] = userid
        return jsonify({'result': 'success', 'msg': '로그인 성공!'})
    else:
        return jsonify({'result': 'fail', 'msg': '로그인 실패. 사용자 ID나 비밀번호를 확인해주세요.'})

@app.route('/logout')
def logout():
    session.pop('userid', None)
    return redirect(url_for('home'))

@app.route('/todo', methods=['GET'])
def get_todos():
    if 'userid' not in session:
        return redirect(url_for('home'))
    
    userid = session['userid']
    user = db.users.find_one({'userid': userid})
    user_name = user['username'] if user else None
    
    todos = list(db.todos.find({'userid': userid}, {'_id': 1, 'title': 1, 'completed': 1}))
    for todo in todos:
        todo['_id'] = str(todo['_id'])
    
    return render_template('todo.html', todos=todos, user_name=user_name)


@app.route('/todo', methods=['POST'])
def post_todo():
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    title = request.form.get('title')
    userid = session['userid']
    result = db.todos.insert_one({'userid': userid, 'title': title, 'completed': False})
    
    if result.inserted_id:
        return jsonify({'result': 'success', 'msg': '할 일 추가됨', 'id': str(result.inserted_id)})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 추가에 실패했습니다.'})
    
@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    userid = session['userid']
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'userid': userid}, {'$set': {'completed': True}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 완료됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 완료 처리에 실패했습니다.'})

@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    userid = session['userid']
    result = db.todos.delete_one({'_id': ObjectId(todo_id), 'userid': userid})
    
    if result.deleted_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 삭제됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 삭제에 실패했습니다.'})

@app.route('/todo/update/<string:todo_id>', methods=['POST'])
def update_todo(todo_id):
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    new_title = request.form.get('title')
    userid = session['userid']
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'userid': userid}, {'$set': {'title': new_title}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '업데이트에 실패했습니다.'})

if __name__ == '__main__':
    app.run(debug=True)