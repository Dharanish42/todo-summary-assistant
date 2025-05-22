import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTodos = async () => {
    const res = await axios.get("/api/todos");
    setTodos(res.data);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async () => {
    if (!input) return;
    await axios.post("/api/todos", { text: input });
    setInput("");
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await axios.delete(`/api/todos/${id}`);
    fetchTodos();
  };

  const summarizeAndSend = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/summarize");
      alert("✅ Sent to Slack: " + res.data.message);
    } catch (e) {
      alert("❌ Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Todo Summary Assistant</h1>
      <div className="flex mb-4">
        <input
          className="border p-2 flex-grow mr-2 rounded"
          placeholder="New todo"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={addTodo}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2 mb-4">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            <span>{todo.text}</span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={summarizeAndSend}
        disabled={loading}
      >
        {loading ? "Summarizing..." : "Summarize & Send to Slack"}
      </button>
    </div>
  );
}

export default App;
