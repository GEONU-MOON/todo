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
          let todoHTML = createTodoHTML(
            todo["_id"],
            todo["title"],
            todo["completed"]
          );
          $("#todo-list").append(todoHTML);
        });
      }
    },
  });
}

function createTodoHTML(id, title, completed) {
  let textDecoration = completed ? "text-decoration: line-through;" : "";
  let buttons = completed
    ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>`
    : `<button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${id}')">완료</button>
         <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode(this, '${id}', '${title}')">수정</button>
         <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>`;

  return `<li class="list-group-item d-flex justify-content-between align-items-center" data-id="${id}" style="${textDecoration}">
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

function completeTodo(id) {
  $.ajax({
    type: "POST",
    url: "/todo/complete",
    data: { id_give: id },
    success: function (response) {
      if (response["result"] == "success") {
        alert("할 일 체크 완료!");
        loadTodos();
      }
    },
  });
}

function deleteTodo(id) {
  $.ajax({
    type: "POST",
    url: "/todo/delete",
    data: { id_give: id },
    success: function (response) {
      if (response["result"] == "success") {
        alert("할 일 삭제 완료!");
        loadTodos();
      }
    },
  });
}

function editTodoMode(element, id, title) {
  let parentLi = $(element).closest("li");
  let originalText = parentLi.find("span:first").text();

  let editHTML = `
      <form class="form-inline w-75" onsubmit="updateTodo(event, '${id}', this)">
          <input type="text" class="form-control mr-2 w-75" value="${title}">
          <button type="submit" class="btn btn-secondary btn-sm mr-1">업데이트</button>
          <button type="button" class="btn btn-warning btn-sm" onclick="cancelEditTodoMode(this, '${id}', '${title}')">취소</button>
      </form>`;

  parentLi.html(editHTML);
}

function updateTodo(event, id, formElement) {
  event.preventDefault();
  let updatedTitle = $(formElement).find("input").val();

  if (updatedTitle.trim() === "") {
    alert("할 일을 입력해주세요!");
    return;
  }

  $.ajax({
    type: "POST",
    url: "/todo/update",
    data: {
      id_give: id,
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

function cancelEditTodoMode(element, id, title) {
  let parentLi = $(element).closest("li");
  let originalTodoHTML = createTodoHTML(id, title, false);
  parentLi.replaceWith(originalTodoHTML);
}

function handleSubmit(event) {
  event.preventDefault(); // 폼 제출 방지
  let title = $("#todo-val").val(); // 입력 필드에서 할 일 제목 가져오기
  if (title.trim() === "") {
    alert("할 일을 입력해주세요!"); // 입력값 검증
    return;
  }
  $.ajax({
    type: "POST", // HTTP POST 요청
    url: "/todo", // 요청을 보낼 URL
    data: { title_give: title }, // 전송할 데이터 (할 일 제목)
    success: function (response) {
      // 요청이 성공했을 때 실행되는 함수
      if (response["result"] == "success") {
        loadTodos(); // 할 일 목록을 다시 불러오는 함수 호출
        $("#todo-val").val(""); // 입력 필드 초기화
        alert("등록 완료!"); // 사용자에게 등록 완료 알림
      }
    },
  });
}
