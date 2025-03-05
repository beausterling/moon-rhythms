import { useState, useEffect } from 'react';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import './App.css';

function App() {
  const [todos, setTodos] = useState(() => {
    // Load todos from localStorage on initial render
    const savedTodos = localStorage.getItem('todos');
    return savedTodos ? JSON.parse(savedTodos) : [];
  });
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAddTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };

  const handleToggleTodo = (id) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true; // 'all'
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Todo List</h1>
        <TodoForm onAddTodo={handleAddTodo} />
        
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''} 
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''} 
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
        
        <ul className="todo-list">
          {filteredTodos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onToggle={handleToggleTodo} 
              onDelete={handleDeleteTodo} 
            />
          ))}
        </ul>
        
        {filteredTodos.length === 0 && (
          <p className="empty-message">
            {filter === 'all' 
              ? 'No tasks yet. Add one above!' 
              : filter === 'active' 
                ? 'No active tasks.' 
                : 'No completed tasks.'}
          </p>
        )}
        
        {todos.length > 0 && (
          <div className="todo-stats">
            <p>{todos.filter(todo => !todo.completed).length} tasks left</p>
            {todos.some(todo => todo.completed) && (
              <button 
                className="clear-completed"
                onClick={() => setTodos(todos.filter(todo => !todo.completed))}
              >
                Clear completed
              </button>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App; 