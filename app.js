const todoInput = document.querySelector("#todoInput");
const todoForm = document.querySelector("#todoForm");
const todoList = document.querySelector("#todoList");
const emptyMessage = document.querySelector("#emptyTodoListMsg");

const todoCntElement = document.querySelector("#todoCnt");
const doneCntElement = document.querySelector("#doneCnt");
const todoProgress = document.querySelector("#todoProgress");
const progressPercent = document.querySelector("#progressPercent");
const focusTodo = document.querySelector("#focusTodo");
const pomodoroMode = document.querySelector("#pomodoroMode");
const pomodoroTime = document.querySelector("#pomodoroTime");
const pomodoroStatus = document.querySelector("#pomodoroStatus");
const pomodoroStart = document.querySelector("#pomodoroStart");
const pomodoroReset = document.querySelector("#pomodoroReset");
const tomatoCountElement = document.querySelector("#tomatoCount");
const tomatoShelf = document.querySelector("#tomatoShelf");
const emptyTomatoMessage = document.querySelector("#emptyTomatoMsg");

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

let timerMode = "focus";
let remainingSeconds = FOCUS_SECONDS;
let timerId = null;
let timerEndsAt = null;
let nextTodoId = 1;
let tomatoCount = 0;

updateSummary();

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo();
});

pomodoroStart.addEventListener("click", togglePomodoro);
pomodoroReset.addEventListener("click", resetPomodoro);

function addTodo() {
  const text = todoInput.value.trim();
  if (text === "") {
    alert("내용을 입력해주세요!");
    todoInput.focus();
    return;
  }

  const todo = document.createElement("li");
  todo.dataset.id = String(nextTodoId++);
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

  const firstDoneTodo = [...todoList.children].find((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    return checkbox.checked;
  });

  if (firstDoneTodo) {
    todoList.insertBefore(todo, firstDoneTodo);
  } else {
    todoList.append(todo);
  }

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

  const percentage = todoCount === 0 ? 0 : Math.round((doneCount / todoCount) * 100);
  todoProgress.value = percentage;
  todoProgress.textContent = `${percentage}%`;
  progressPercent.textContent = `${percentage}%`;
  updateFocusOptions();
}

function updateFocusOptions() {
  const selectedTodo = focusTodo.value;
  const activeTodos = [...todoList.children].filter((todo) => {
    return !todo.querySelector('input[type="checkbox"]').checked;
  });

  focusTodo.replaceChildren(new Option("집중할 할 일을 선택하세요", ""));

  activeTodos.forEach((todo) => {
    const text = todo.querySelector("span").textContent;
    focusTodo.add(new Option(text, todo.dataset.id));
  });

  const selectedOptionExists = [...focusTodo.options].some((option) => {
    return option.value === selectedTodo;
  });

  if (selectedOptionExists) focusTodo.value = selectedTodo;
}

function togglePomodoro() {
  if (timerId) {
    pausePomodoro();
    return;
  }

  timerEndsAt = Date.now() + remainingSeconds * 1000;
  timerId = window.setInterval(updatePomodoro, 250);
  pomodoroStart.textContent = "일시 정지";
  pomodoroStatus.textContent = timerMode === "focus" ? "집중하고 있어요." : "잠시 쉬어가세요.";
}

function pausePomodoro() {
  window.clearInterval(timerId);
  timerId = null;
  timerEndsAt = null;
  pomodoroStart.textContent = "계속하기";
  pomodoroStatus.textContent = "타이머를 잠시 멈췄어요.";
}

function updatePomodoro() {
  remainingSeconds = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
  renderPomodoroTime();

  if (remainingSeconds === 0) finishPomodoro();
}

function finishPomodoro() {
  window.clearInterval(timerId);
  timerId = null;
  timerEndsAt = null;

  if (timerMode === "focus") {
    addTomato();
    timerMode = "break";
    remainingSeconds = BREAK_SECONDS;
    pomodoroStatus.textContent = "집중 완료! 5분 동안 쉬어가세요.";
  } else {
    timerMode = "focus";
    remainingSeconds = FOCUS_SECONDS;
    pomodoroStatus.textContent = "휴식 완료! 다음 집중을 준비하세요.";
  }

  renderPomodoro();
}

function resetPomodoro() {
  window.clearInterval(timerId);
  timerId = null;
  timerEndsAt = null;
  timerMode = "focus";
  remainingSeconds = FOCUS_SECONDS;
  pomodoroStatus.textContent = "집중할 준비가 됐어요.";
  renderPomodoro();
}

function renderPomodoro() {
  pomodoroMode.textContent = timerMode === "focus" ? "집중" : "휴식";
  pomodoroMode.classList.toggle("break", timerMode === "break");
  pomodoroStart.textContent = "시작";
  renderPomodoroTime();
}

function renderPomodoroTime() {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  pomodoroTime.textContent = `${minutes}:${seconds}`;
  document.title = timerId ? `${minutes}:${seconds} · TodoList` : "TodoList 실습";
}

function addTomato() {
  tomatoCount++;

  const tomatoItem = document.createElement("li");
  const tomatoImage = document.createElement("img");
  tomatoImage.src = "assets/third-party/noto-emoji/tomato.png";
  tomatoImage.alt = "";
  tomatoImage.width = 32;
  tomatoImage.height = 32;

  tomatoItem.title = `${tomatoCount}번째 집중 세션`;
  tomatoItem.setAttribute("aria-label", `${tomatoCount}번째 집중 세션 완료`);
  tomatoItem.append(tomatoImage);
  tomatoShelf.append(tomatoItem);

  tomatoCountElement.textContent = tomatoCount;
  emptyTomatoMessage.hidden = true;
}
