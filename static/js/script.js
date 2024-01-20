$(document).ready(function () {
  initializeTodoApp();
});

function initializeTodoApp() {
  loadTodos();
}

function loadTodos() {
  $.ajax({
    type: "GET",
    url: "/todo",
    data: {},
    success: function (response) {
      if (response["result"] == "success") {
        let todos = response["todos"];
        $("#todo-list").empty();
        todos.forEach(function (todo) {
          let todoHTML = createTodoHTML(todo["title"], todo["completed"]);
          $("#todo-list").append(todoHTML);
        });
      }
    },
  });
}

function createTodoHTML(title, completed) {
  let textDecoration = completed ? "text-decoration: line-through;" : "";
  let buttons = completed
    ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${title}')">삭제</button>`
    : `<button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${title}')">완료</button>
               <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode(this, '${title}')">수정</button>
               <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${title}')">삭제</button>`;

  return `<li class="list-group-item d-flex justify-content-between align-items-center" style="${textDecoration}">
                    <span>${title}</span>
                    <span>${buttons}</span>
                </li>`;
}

$("#addTodoButton").click(function () {
  let title = $("#todo-val").val();
  if (title.trim() === "") {
    alert("할 일을 입력해주세요!");
    return;
  }
  $.ajax({
    type: "POST",
    url: "/todo",
    data: { title_give: title },
    success: function (response) {
      if (response["result"] == "success") {
        loadTodos();
        $("#todo-val").val("");
        alert("등록 완료!");
      }
    },
  });
});

function completeTodo(title) {
  $.ajax({
    type: "POST",
    url: "/todo/complete",
    data: { title_give: title },
    success: function (response) {
      if (response["result"] == "success") {
        alert("할 일 체크 완료!");
        loadTodos();
      }
    },
  });
}

function deleteTodo(title) {
  $.ajax({
    type: "POST",
    url: "/todo/delete",
    data: { title_give: title },
    success: function (response) {
      if (response["result"] == "success") {
        alert("할 일 삭제 완료!");
        loadTodos();
      }
    },
  });
}

function editTodoMode(element, title) {
  let parentLi = $(element).closest("li");
  let originalText = parentLi.find("span:first").text();

  let editHTML = `
            <form class="form-inline w-75" onsubmit="updateTodo(event, '${title}', '${originalText}')">
                <input type="text" class="form-control mr-2 w-75" value="${originalText}">
                <button type="submit" class="btn btn-secondary btn-sm mr-1">업데이트</button>
                <button type="button" class="btn btn-warning btn-sm" onclick="cancelEditTodoMode(this, '${originalText}')">취소</button>
            </form>`;

  parentLi.html(editHTML);
}

function updateTodo(event, originalTitle, originalText) {
  event.preventDefault();
  let updatedTitle = $(event.target).find("input").val();

  if (updatedTitle.trim() === "") {
    alert("할 일을 입력해주세요!");
    return;
  }

  $.ajax({
    type: "POST",
    url: "/todo/update",
    data: {
      original_title_give: originalTitle,
      updated_title_give: updatedTitle,
    },
    success: function (response) {
      if (response["result"] == "success") {
        alert("할 일이 업데이트 되었습니다.");
        loadTodos();
      } else {
        alert("업데이트에 실패했습니다. 다시 시도해주세요.");
      }
    },
  });
}

function cancelEditTodoMode(element, originalTitle, wasCompleted) {
  let parentLi = $(element).closest("li");
  let originalTodoHTML = createTodoHTML(originalTitle, wasCompleted);
  parentLi.replaceWith(originalTodoHTML);
}
