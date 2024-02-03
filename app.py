from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_url_path='/static')
app.secret_key = 'your_secret_key'

app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

# MongoDB 클라이언트 설정 - 자신의 MongoDB URI를 사용하세요
client = MongoClient('mongodb+srv://moondy2209:비밀번호@cluster0.t0cskbu.mongodb.net/?retryWrites=true&w=majority')
db = client.dbjungle

@app.route('/')
def home():
    # 로그인 상태 확인
    if 'username' in session:
        return redirect(url_for('get_todos'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password)
        
        if db.users.find_one({'username': username}):
            return jsonify({'result': 'fail', 'msg': '이미 존재하는 사용자명입니다.'})
        
        db.users.insert_one({'username': username, 'password': hashed_password})
        return jsonify({'result': 'success', 'msg': '회원가입 성공!'})
    return render_template('register.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    user = db.users.find_one({'username': username})
    
    if user and check_password_hash(user['password'], password):
        session['username'] = username
        return jsonify({'result': 'success', 'msg': '로그인 성공!'})
    else:
        return jsonify({'result': 'fail', 'msg': '로그인 실패. 사용자명이나 비밀번호를 확인해주세요.'})

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('home'))

@app.route('/todo', methods=['GET'])
def get_todos():
    if 'username' not in session:
        return redirect(url_for('home'))
    
    # 사용자 이름을 세션에서 가져오기
    user_name = session.get('username')
    
    todos = list(db.todos.find({'username': user_name}, {'_id': 1, 'title': 1, 'completed': 1}))
    
    # Convert ObjectId to string
    for todo in todos:
        todo['_id'] = str(todo['_id'])
    
    # 렌더링할 HTML 템플릿을 사용하여 할 일 목록을 렌더링
    return render_template('todo.html', todos=todos, user_name=user_name)

@app.route('/todo', methods=['POST'])
def post_todo():
    if 'username' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    title = request.form.get('title')
    result = db.todos.insert_one({'username': session['username'], 'title': title, 'completed': False})
    
    if result.inserted_id:
        return jsonify({'result': 'success', 'msg': '할 일 추가됨', 'id': str(result.inserted_id)})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 추가에 실패했습니다.'})

@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    if 'username' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'username': session['username']}, {'$set': {'completed': True}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 완료됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 완료 처리에 실패했습니다.'})

@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    if 'username' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    result = db.todos.delete_one({'_id': ObjectId(todo_id), 'username': session['username']})
    
    if result.deleted_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 삭제됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 삭제에 실패했습니다.'})

@app.route('/todo/update/<string:todo_id>', methods=['POST'])
def update_todo(todo_id):
    if 'username' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})

    new_title = request.form.get('title')
    
    # MongoDB에서 해당 할 일을 업데이트합니다.
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'username': session['username']}, {'$set': {'title': new_title}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '업데이트에 실패했습니다.'})

if __name__ == '__main__':
    app.run(debug=True)