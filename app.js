const todoInput = document.querySelector("#todoInput");
const todoForm = document.querySelector("#todoForm");
const todoList = document.querySelector("#todoList");
const emptyMessage = document.querySelector("#emptyTodoListMsg");

const todoCntElement = document.querySelector("#todoCnt");
const doneCntElement = document.querySelector("#doneCnt");

updateSummary();

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
  delBtn.type = "button";
  delBtn.textContent = "X";
  delBtn.className = "delBtn";
  delBtn.setAttribute("aria-label", `${text} 삭제`);

  checkbox.addEventListener("change", () => {
    todoText.classList.toggle("done", checkbox.checked);
    moveTodo(todo, checkbox.checked);
    updateSummary();
  });

  delBtn.addEventListener("click", () => {
    todo.remove();
    updateSummary();
  });

  label.append(checkbox, todoText);
  todo.append(label, delBtn);
  todoList.appendChild(todo);

  updateSummary();

  todoInput.value = "";
  todoInput.focus();
}

function moveTodo(todo, isDone) {
  const previousPositions = new Map(
    [...todoList.children].map((item) => [item, item.getBoundingClientRect().top]),
  );

  if (isDone) {
    todoList.append(todo);
  } else {
    const firstDoneTodo = [...todoList.children].find((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      return checkbox.checked;
    });

    if (firstDoneTodo) {
      todoList.insertBefore(todo, firstDoneTodo);
    } else {
      todoList.append(todo);
    }
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  [...todoList.children].forEach((item) => {
    const previousTop = previousPositions.get(item);
    const currentTop = item.getBoundingClientRect().top;
    const distance = previousTop - currentTop;

    if (distance === 0) return;

    item.animate(
      [{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }],
      { duration: 300, easing: "ease-out" },
    );
  });
}

function updateSummary() {
  const todoCount = todoList.children.length;
  const doneCount = todoList.querySelectorAll('input[type="checkbox"]:checked').length;

  todoCntElement.textContent = todoCount;
  doneCntElement.textContent = doneCount;
  emptyMessage.hidden = todoCount !== 0;
}
