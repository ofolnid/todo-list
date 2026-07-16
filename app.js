const todoInput = document.querySelector("#todoInput");
const todoForm = document.querySelector("#todoForm");
const todoList = document.querySelector("#todoList");
const emptyMessage = document.querySelector("#emptyTodoListMsg");

const todoCntElement = document.querySelector("#todoCnt");
const doneCntElement = document.querySelector("#doneCnt");

let todoCnt = 0;
let doneCnt = 0;

updateEmptyMessage();
updateCount();

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo();
});

function addTodo() {
  const text = todoInput.value.trim();
  if (text === "") {
    alert("내용을 입력해주세요!");
    todoInput.focus();
    return;
  }

  const todo = document.createElement("li");

  const label = document.createElement("label");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const todoText = document.createElement("span");
  todoText.textContent = text;

  const delBtn = document.createElement("button");
  delBtn.textContent = "X";
  delBtn.className = "delBtn";

  checkbox.addEventListener("change", () => {
    todoText.classList.toggle("done", checkbox.checked);
    moveTodo(todo, checkbox.checked);
    updateCount();
  });

  delBtn.addEventListener("click", () => {
    if (checkbox.checked) {
      doneCnt--;
    }
    todo.remove();
    todoCnt--;
    updateEmptyMessage();
    updateCount();
  });

  label.append(checkbox, todoText);
  todo.append(label, delBtn);
  todoList.appendChild(todo);

  todoCnt++;
  updateCount();
  updateEmptyMessage();

  todoInput.value = "";
  todoInput.focus();
}

function moveTodo(todo, isDone) {
  if (isDone) {
    todoList.append(todo);
    doneCnt++;
    return;
  }

  const firstDoneTodo = [...todoList.children].find((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]');

    return checkbox.checked;
  });

  if (firstDoneTodo) {
    todoList.insertBefore(todo, firstDoneTodo);
  } else {
    todoList.append(todo);
  }
  doneCnt--;
}

function updateEmptyMessage() {
  emptyMessage.hidden = todoCnt !== 0;
}

function updateCount() {
  todoCntElement.textContent = todoCnt;
  doneCntElement.textContent = doneCnt;
}
