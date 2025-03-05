import React from 'react';

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={todo.completed ? 'completed' : ''}>
      <div className="todo-content">
        <input 
          type="checkbox" 
          checked={todo.completed} 
          onChange={() => onToggle(todo.id)} 
          className="todo-checkbox"
        />
        <span onClick={() => onToggle(todo.id)}>
          {todo.text}
        </span>
      </div>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}

export default TodoItem; 