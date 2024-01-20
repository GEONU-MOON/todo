from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient

app = Flask(__name__)

client = MongoClient('mongodb+srv://moondy2209:암호입력@cluster0.t0cskbu.mongodb.net/?retryWrites=true&w=majority')
db = client.dbjungle

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/todo', methods=['GET'])
def get_todos():
    todos = list(db.todos.find({}, {'_id': 0}))
    return jsonify({'result': 'success', 'todos': todos})

@app.route('/todo', methods=['POST'])
def post_todo():
    title_receive = request.form['title_give']
    db.todos.insert_one({'title': title_receive, 'completed': False})
    return jsonify({'result': 'success', 'msg': '할 일 추가됨'})

@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    title_receive = request.form['title_give']
    db.todos.update_one({'title': title_receive}, {'$set': {'completed': True}})
    return jsonify({'result': 'success', 'msg': '할 일 완료됨'})

@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    title_receive = request.form['title_give']
    db.todos.delete_one({'title': title_receive})
    return jsonify({'result': 'success', 'msg': '할 일 삭제됨'})

@app.route('/todo/update', methods=['POST'])
def update_todo():
    original_title_receive = request.form['original_title_give']
    updated_title_receive = request.form['updated_title_give']
    db.todos.update_one({'title': original_title_receive}, {'$set': {'title': updated_title_receive}})
    return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'})

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)