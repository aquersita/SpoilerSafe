from flask import Blueprint, render_template, request, session, redirect, url_for
from models import db, Todo

todo_bp = Blueprint('todo_bp', __name__)

@todo_bp.route('/todos', methods=['GET', 'POST'])
def todos():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        content = request.form.get('content')
        if content:
            new_todo = Todo(content, session['user_id'])
            db.session.add(new_todo)
            db.session.commit()
    
    user_todos = Todo.query.filter_by(user_id=session['user_id']).all()
    return render_template('todos.html', todos=user_todos)

@todo_bp.route('/todos/<int:todo_id>/toggle')
def toggle_todo(todo_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    todo = Todo.query.get(todo_id)
    if todo and todo.user_id == session['user_id']:
        todo.completed = not todo.completed
        db.session.commit()
        
    return redirect(url_for('todo_bp.todos'))
