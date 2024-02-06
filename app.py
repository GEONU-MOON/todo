from flask import Flask, render_template, jsonify, request, redirect, url_for, session
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import re

# Flask 애플리케이션 초기화 및 설정
app = Flask(__name__, static_url_path='/static')
# 애플리케이션을 위한 비밀 키 설정, 세션 관리에 사용
app.secret_key = 'Cs5#pUZ\$T5t"4Hc%mX\*Uyt)9y'
# 템플릿 자동 리로드 활성화, 개발 시 템플릿 변경을 바로 반영하기 위함
app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True

# MongoDB 클라이언트 설정, 데이터베이스 접속을 위한 URI 사용
client = MongoClient('mongodb+srv://<your_connection_string>')
# 데이터베이스 선택
db = client.dbjungle

@app.route('/')
def home():
    # 로그인 상태 확인 후, 로그인 되어 있다면 할 일 목록 페이지로 리다이렉트
    if 'userid' in session:
        return redirect(url_for('get_todos'))
    # 로그인 되어 있지 않다면, 홈페이지 (로그인 페이지) 렌더링
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    # 회원가입 요청 처리
    if request.method == 'POST':
        # 폼 데이터에서 사용자 정보 추출 및 공백 제거
        userid = request.form.get('userid').strip()
        username = request.form.get('username').strip()
        password = request.form.get('password')

        # 입력 값 유효성 검사
        if not re.match(r'^[a-zA-Z0-9!@#$%^&*]{6,12}$', userid) or \
           not re.match(r'^.{6,}$', password) or \
           not re.match(r'^[가-힣a-zA-Z0-9]{1,15}$', username):
            return jsonify({'result': 'fail', 'msg': '잘못된 입력 형식입니다.'})

        # 사용자 ID 중복 검사
        if db.users.find_one({'userid': userid}):
            return jsonify({'result': 'fail', 'msg': '이미 존재하는 사용자 ID입니다.'})

        # 비밀번호 해싱 후 사용자 정보 데이터베이스에 저장
        hashed_password = generate_password_hash(password)
        db.users.insert_one({'userid': userid, 'username': username, 'password': hashed_password})
        return jsonify({'result': 'success', 'msg': '회원가입 성공!'})
    else:
        # GET 요청 시, 회원가입 폼 페이지 렌더링
        return render_template('register.html')

@app.route('/check_userid', methods=['POST'])
def check_userid():
    # 사용자 ID 중복 검사
    userid = request.form.get('userid').strip()
    user = db.users.find_one({'userid': userid})
    # 사용자 ID가 데이터베이스에 존재하지 않으면 사용 가능
    return jsonify({'isAvailable': not bool(user)})

@app.route('/login', methods=['POST'])
def login():
    # 로그인 요청 처리
    userid = request.form.get('userid')
    password = request.form.get('password')
    user = db.users.find_one({'userid': userid})
    
    # 사용자 인증 성공 시 세션에 사용자 정보 저장
    if user and check_password_hash(user['password'], password):
        session['userid'] = userid
        return jsonify({'result': 'success', 'msg': '로그인 성공!'})
    else:
        # 인증 실패 시 실패 메시지 반환
        return jsonify({'result': 'fail', 'msg': '로그인 실패. 사용자 ID나 비밀번호를 확인해주세요.'})

@app.route('/logout')
def logout():
    # 로그아웃 요청 처리, 세션에서 사용자 정보 제거
    session.pop('userid', None)
    return redirect(url_for('home'))

@app.route('/todo', methods=['GET'])
def get_todos():
    # 할 일 목록 조회
    if 'userid' not in session:
        # 로그인 되어 있지 않은 사용자는 홈으로 리다이렉트
        return redirect(url_for('home'))
    
    userid = session['userid']
    user = db.users.find_one({'userid': userid})
    user_name = user['username'] if user else None
    
    # 사용자별 할 일 목록 조회 및 렌더링
    todos = list(db.todos.find({'userid': userid}, {'_id': 1, 'title': 1, 'completed': 1}))
    for todo in todos:
        todo['_id'] = str(todo['_id'])
    
    return render_template('todo.html', todos=todos, user_name=user_name)

@app.route('/todo', methods=['POST'])
def post_todo():
    # 할 일 추가 요청 처리
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    title = request.form.get('title')
    userid = session['userid']
    # 할 일 정보 데이터베이스에 저장
    result = db.todos.insert_one({'userid': userid, 'title': title, 'completed': False})
    
    if result.inserted_id:
        return jsonify({'result': 'success', 'msg': '할 일 추가됨', 'id': str(result.inserted_id)})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 추가에 실패했습니다.'})
    
@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    # 할 일 완료 상태 변경 요청 처리
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    userid = session['userid']
    # 할 일 완료 상태로 데이터베이스 업데이트
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'userid': userid}, {'$set': {'completed': True}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 완료됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 완료 처리에 실패했습니다.'})

@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    # 할 일 삭제 요청 처리
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    todo_id = request.form.get('id')
    userid = session['userid']
    # 할 일 데이터베이스에서 삭제
    result = db.todos.delete_one({'_id': ObjectId(todo_id), 'userid': userid})
    
    if result.deleted_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 삭제됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '할 일 삭제에 실패했습니다.'})

@app.route('/todo/update/<string:todo_id>', methods=['POST'])
def update_todo(todo_id):
    # 할 일 수정 요청 처리
    if 'userid' not in session:
        return jsonify({'result': 'fail', 'msg': '로그인이 필요합니다.'})
    
    new_title = request.form.get('title')
    userid = session['userid']
    # 할 일 제목 데이터베이스에서 업데이트
    result = db.todos.update_one({'_id': ObjectId(todo_id), 'userid': userid}, {'$set': {'title': new_title}})
    
    if result.modified_count == 1:
        return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'})
    else:
        return jsonify({'result': 'fail', 'msg': '업데이트에 실패했습니다.'})

# 애플리케이션 실행
if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
