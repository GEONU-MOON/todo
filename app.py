from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient

# Flask 애플리케이션 인스턴스 생성
app = Flask(__name__)

# MongoDB 클라이언트 설정 및 데이터베이스 연결
client = MongoClient('mongodb+srv://[username]:[password]@cluster0.t0cskbu.mongodb.net/?retryWrites=true&w=majority')
db = client.dbjungle

# 홈페이지 라우트: 기본 URL 접근 시 index.html 반환
@app.route('/')
def home():
    return render_template('index.html')

# 할 일 목록 조회 라우트: GET 요청 시 DB에서 할 일 목록 조회 후 반환
@app.route('/todo', methods=['GET'])
def get_todos():
    todos = list(db.todos.find({}, {'_id': 0})) # MongoDB에서 할 일 목록 조회
    return jsonify({'result': 'success', 'todos': todos}) # 조회 결과를 JSON 형태로 반환

# 할 일 추가 라우트: POST 요청 시 DB에 새 할 일 추가
@app.route('/todo', methods=['POST'])
def post_todo():
    title_receive = request.form['title_give'] # 클라이언트로부터 받은 할 일 제목
    db.todos.insert_one({'title': title_receive, 'completed': False}) # DB에 새 할 일 추가
    return jsonify({'result': 'success', 'msg': '할 일 추가됨'}) # 성공 메시지 반환

# 할 일 완료 처리 라우트: POST 요청 시 DB에서 해당 할 일을 완료 상태로 업데이트
@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    title_receive = request.form['title_give'] # 클라이언트로부터 받은 할 일 제목
    db.todos.update_one({'title': title_receive}, {'$set': {'completed': True}}) # 해당 할 일을 완료 상태로 업데이트
    return jsonify({'result': 'success', 'msg': '할 일 완료됨'}) # 성공 메시지 반환

# 할 일 삭제 라우트: POST 요청 시 DB에서 해당 할 일 삭제
@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    title_receive = request.form['title_give'] # 클라이언트로부터 받은 할 일 제목
    db.todos.delete_one({'title': title_receive}) # DB에서 해당 할 일 삭제
    return jsonify({'result': 'success', 'msg': '할 일 삭제됨'}) # 성공 메시지 반환

# 할 일 업데이트 라우트: POST 요청 시 DB에서 해당 할 일 제목 업데이트
@app.route('/todo/update', methods=['POST'])
def update_todo():
    original_title_receive = request.form['original_title_give'] # 원래 할 일 제목
    updated_title_receive = request.form['updated_title_give'] # 업데이트할 새 제목
    db.todos.update_one({'title': original_title_receive}, {'$set': {'title': updated_title_receive}}) # 해당 할 일 제목 업데이트
    return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'}) # 성공 메시지 반환

# Flask 애플리케이션 실행
if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
