const todoInput = document.querySelector("#todoInput");
const todoForm = document.querySelector("#todoForm");
const todoList = document.querySelector("#todoList");
const completedTodoList = document.querySelector("#completedTodoList");
const emptyMessage = document.querySelector("#emptyTodoListMsg");
const completedWidget = document.querySelector("#completedWidget");
const completedCntElement = document.querySelector("#completedCnt");
const clearCompletedBtn = document.querySelector("#clearCompletedBtn");

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
const completionMessage = document.querySelector("#completionMessage");

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
clearCompletedBtn.addEventListener("click", clearCompletedTodos);

if (typeof window.Sortable === "function") {
  window.Sortable.create(todoList, {
    animation: 180,
    handle: ".drag-handle",
    ghostClass: "todo-ghost",
    chosenClass: "todo-chosen",
    fallbackClass: "todo-drag-preview",
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (text === "") {
    alert("내용을 입력해주세요!");
    todoInput.focus();
    return;
  }

  const todo = document.createElement("li");
  todo.dataset.id = String(nextTodoId++);

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.textContent = "⠿";
  dragHandle.tabIndex = 0;
  dragHandle.setAttribute("role", "button");
  dragHandle.setAttribute("aria-label", `${text} 우선순위 변경`);
  dragHandle.title = "드래그하거나 Alt + 위/아래 방향키로 순서 변경";
  dragHandle.addEventListener("keydown", (event) => moveTodoWithKeyboard(event, todo));

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
    if (checkbox.checked) celebrateAllTodosDone();
  });

  delBtn.addEventListener("click", () => {
    todo.remove();
    updateSummary();
  });

  label.append(checkbox, todoText);
  todo.append(dragHandle, label, delBtn);
  todoList.append(todo);

  updateSummary();

  todoInput.value = "";
  todoInput.focus();
}

function moveTodo(todo, isDone) {
  const previousPositions = new Map(
    getAllTodoItems().map((item) => [item, item.getBoundingClientRect()]),
  );

  if (isDone) {
    completedWidget.hidden = false;
    completedTodoList.prepend(todo);
  } else {
    todoList.append(todo);
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  getAllTodoItems().forEach((item) => {
    const previousPosition = previousPositions.get(item);
    const currentPosition = item.getBoundingClientRect();
    const distanceX = previousPosition.left - currentPosition.left;
    const distanceY = previousPosition.top - currentPosition.top;

    if (distanceX === 0 && distanceY === 0) return;

    item.animate(
      [
        { transform: `translate(${distanceX}px, ${distanceY}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  });
}

function updateSummary() {
  const activeCount = todoList.children.length;
  const doneCount = completedTodoList.children.length;
  const todoCount = activeCount + doneCount;

  todoCntElement.textContent = todoCount;
  doneCntElement.textContent = doneCount;
  completedCntElement.textContent = doneCount;
  emptyMessage.hidden = activeCount !== 0;
  completedWidget.hidden = doneCount === 0;

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

function celebrateAllTodosDone() {
  const todoCount = getAllTodoItems().length;
  const doneCount = completedTodoList.children.length;

  if (todoCount === 0 || todoCount !== doneCount) return;

  completionMessage.hidden = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    window.setTimeout(() => {
      completionMessage.hidden = true;
    }, 2800);
    return;
  }

  const messageAnimation = completionMessage.animate(
    [
      { opacity: 0, transform: "translate(-50%, 12px)" },
      { opacity: 1, transform: "translate(-50%, 0)", offset: 0.2 },
      { opacity: 1, transform: "translate(-50%, 0)", offset: 0.8 },
      { opacity: 0, transform: "translate(-50%, -8px)" },
    ],
    { duration: 2800, easing: "ease-out" },
  );
  messageAnimation.onfinish = () => {
    completionMessage.hidden = true;
  };

  if (typeof window.confetti !== "function") return;

  const options = {
    particleCount: 55,
    spread: 65,
    startVelocity: 35,
    colors: ["#007fe7", "#83dcff", "#f0fbff", "#ffd166"],
    disableForReducedMotion: true,
  };

  window.confetti({ ...options, angle: 60, origin: { x: 0, y: 0.65 } });
  window.confetti({ ...options, angle: 120, origin: { x: 1, y: 0.65 } });
}

function getAllTodoItems() {
  return [...todoList.children, ...completedTodoList.children];
}

function clearCompletedTodos() {
  completedTodoList.replaceChildren();
  updateSummary();
}

function moveTodoWithKeyboard(event, todo) {
  if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;

  event.preventDefault();
  const sibling = event.key === "ArrowUp" ? todo.previousElementSibling : todo.nextElementSibling;
  if (!sibling) return;

  if (event.key === "ArrowUp") {
    todoList.insertBefore(todo, sibling);
  } else {
    todoList.insertBefore(sibling, todo);
  }

  todo.querySelector(".drag-handle").focus();
}
