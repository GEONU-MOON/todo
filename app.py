from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)

client = MongoClient('mongodb+srv://아이디:비번@cluster0.t0cskbu.mongodb.net/?retryWrites=true&w=majority')
db = client.dbjungle

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/todo', methods=['GET'])
def get_todos():
    todos = list(db.todos.find({}, {'_id': 1, 'title': 1, 'completed': 1}))
    for todo in todos:
        todo['_id'] = str(todo['_id'])
    return jsonify({'result': 'success', 'todos': todos})

@app.route('/todo', methods=['POST'])
def post_todo():
    title_receive = request.form['title_give']
    db.todos.insert_one({'title': title_receive, 'completed': False})
    return jsonify({'result': 'success', 'msg': '할 일 추가됨'})

@app.route('/todo/complete', methods=['POST'])
def complete_todo():
    id_receive = request.form['id_give']
    db.todos.update_one({'_id': ObjectId(id_receive)}, {'$set': {'completed': True}})
    return jsonify({'result': 'success', 'msg': '할 일 완료됨'})

@app.route('/todo/delete', methods=['POST'])
def delete_todo():
    id_receive = request.form['id_give']
    db.todos.delete_one({'_id': ObjectId(id_receive)})
    return jsonify({'result': 'success', 'msg': '할 일 삭제됨'})

@app.route('/todo/update', methods=['POST'])
def update_todo():
    id_receive = request.form['id_give']
    updated_title_receive = request.form['updated_title_give']
    db.todos.update_one({'_id': ObjectId(id_receive)}, {'$set': {'title': updated_title_receive}})
    return jsonify({'result': 'success', 'msg': '할 일 업데이트됨'})

if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)

