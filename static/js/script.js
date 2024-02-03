$(document).ready(function () {
  initializeTodoApp();
  setupEventHandlers();
});

function initializeTodoApp() {
  // 페이지가 로드되면 초기화
  if ($("#todo-list").length > 0) {
    loadTodos();
  }
}

function setupEventHandlers() {
  // 이벤트 핸들러 설정
  $("#register-form")
    .off("submit")
    .on("submit", function (event) {
      event.preventDefault();
      if (validateForm()) {
        registerUser();
      }
    });

  $("#login-form").submit(function (event) {
    event.preventDefault();
    loginUser();
  });

  $("#logout-button").click(function () {
    logoutUser();
  });

  $("#addTodoButton").click(function (event) {
    event.preventDefault();
    let title = $("#todo-val").val();
    if (title.trim() === "") {
      alert("할 일을 입력해주세요!");
      return;
    }
    addTodo(title);
  });
}

// 사용자 등록
function registerUser() {
  // 폼 데이터를 변수에 저장
  var userdata = {
    userid: $("#userid").val(),
    username: $("#username").val(),
    password: $("#password").val(),
  };

  // 제출 버튼 비활성화
  $("button[type=submit]").prop("disabled", true);

  $.ajax({
    type: "POST",
    url: "/register",
    data: userdata,
    success: function (response) {
      // 성공 시 로직
      alert(response.msg);
      if (response.result === "success") {
        window.location.href = "/";
      } else {
        // 실패 시 버튼을 다시 활성화
        $("button[type=submit]").prop("disabled", false);
      }
    },
    error: function () {
      alert("서버 오류가 발생했습니다.");
      // 오류 시 버튼을 다시 활성화
      $("button[type=submit]").prop("disabled", false);
    },
  });
}

function checkUserId() {
  var userid = $("#userid").val().trim(); // 공백 제거
  $("#userid").val(userid); // 정제된 값을 다시 입력 필드에 설정

  if (!userid) {
    alert("사용자 ID를 입력해주세요.");
    return;
  }

  $.ajax({
    type: "POST",
    url: "/check_userid", // 중복 검사를 위한 URL
    data: {
      userid: userid,
    },
    success: function (response) {
      if (response.isAvailable) {
        alert("사용 가능한 사용자 ID입니다.");
      } else {
        alert("이미 사용 중인 사용자 ID입니다.");
      }
    },
  });
}

// 로그인
function loginUser() {
  var userid = $("#userid").val(); // 사용자 ID 입력값 가져오기
  var password = $("#password").val();

  $.ajax({
    type: "POST",
    url: "/login",
    data: {
      userid: userid, // 'username' 대신 'userid' 사용
      password: password,
    },
    success: function (response) {
      if (response.result === "success") {
        alert("로그인 성공!");
        window.location.reload();
      } else {
        alert(response.msg);
      }
    },
  });
}

// 로그아웃
function logoutUser() {
  $.ajax({
    type: "GET",
    url: "/logout",
    success: function () {
      window.location.href = "/";
    },
  });
}

function loadTodos() {
  $.ajax({
    type: "GET",
    url: "/todo",
    dataType: "json",
    success: function (response) {
      if (response && response.result === "success" && response.todos) {
        let todos = response.todos;
        $("#todo-list").empty(); // 할 일 목록 초기화
        for (let i = 0; i < todos.length; i++) {
          let todo = todos[i];
          let todoHTML = createTodoHTML(todo._id, todo.title, todo.completed);
          $("#todo-list").append(todoHTML); // 할 일 목록에 추가
        }
      } else {
        console.error("Response is not as expected.");
      }
    },
    error: function (error) {
      console.error("Error while fetching todos:", error);
    },
  });
}

// 할 일 추가
function addTodo(title) {
  $.ajax({
    type: "POST",
    url: "/todo",
    data: {
      title: title,
    },
    success: function (response) {
      if (response.result === "success") {
        $("#todo-val").val("");
        // 부분 업데이트: 추가한 할 일을 목록에 동적으로 추가
        let todoHTML = createTodoHTML(response.id, title, false);
        $("#todo-list").append(todoHTML);
        alert("할 일이 추가되었습니다.");
      }
    },
  });
}

function createTodoHTML(id, title, completed) {
  let textDecoration = completed ? "text-decoration: line-through;" : "";
  let buttons = `
    <button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${id}')">완료</button>
    <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode('${id}', '${title}')">수정</button>
    <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>
  `;

  if (completed) {
    buttons = `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>`;
  }

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${id}" style="${textDecoration}">
      <span>${title}</span>
      <span>${buttons}</span>
    </li>
  `;
}

function completeTodo(id) {
  $.ajax({
    type: "POST",
    url: "/todo/complete",
    data: {
      id: id,
    },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 완료되었습니다.");
        // 완료된 할 일의 스타일 변경
        let todoItem = $(`li[data-id='${id}']`);
        todoItem.css("text-decoration", "line-through");

        // 완료 버튼과 수정 버튼 숨기기
        let completeBtn = todoItem.find(".complete-btn");
        let editBtn = todoItem.find(".edit-btn");
        completeBtn.hide();
        editBtn.hide();
      }
    },
    error: function (error) {
      alert("서버 요청에 실패했습니다.");
    },
  });
}

// 할 일 삭제 처리
function deleteTodo(id) {
  $.ajax({
    type: "POST",
    url: "/todo/delete",
    data: {
      id: id,
    },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 삭제되었습니다.");
        // 부분 업데이트: 삭제한 할 일을 목록에서 제거
        $(`li[data-id='${id}']`).remove();
      }
    },
    error: function (error) {
      alert("서버 요청에 실패했습니다.");
    },
  });
}

// 할 일 수정 모드 활성화
function editTodoMode(id, title) {
  let parentLi = $(`li[data-id='${id}']`);
  parentLi.html(`<form class="form-inline" onsubmit="updateTodo(event, '${id}')">
                    <input type="text" class="form-control mr-2" value="${title}">
                    <button type="submit" class="btn btn-primary">업데이트</button>
                    <button type="button" class="btn btn-secondary" onclick="exitEditTodoMode('${id}', '${title}')">취소</button>
                </form>`);
}

// 할 일 수정 모드 종료
function exitEditTodoMode(id, title) {
  let parentLi = $(`li[data-id='${id}']`);
  parentLi.html(`
    <span>${title}</span>
    <span>
      <button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${id}')">완료</button>
      <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode('${id}', '${title}')">수정</button>
      <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>
    </span>
  `);
}

// 할 일 업데이트
function updateTodo(event, id) {
  event.preventDefault(); // 폼 제출 기본 동작 방지
  let updatedTitle = $(event.target).find("input").val();

  $.ajax({
    type: "POST",
    url: `/todo/update/${id}`, // 수정된 URL 사용
    data: {
      id: id,
      title: updatedTitle,
    },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 업데이트 되었습니다.");
        // 부분 업데이트: 수정된 할 일의 내용 변경
        let todoItem = $(`li[data-id='${id}']`);
        todoItem.find("span").first().text(updatedTitle);
        exitEditTodoMode(id, updatedTitle); // 수정 모드 종료
      } else {
        alert("업데이트에 실패했습니다.");
      }
    },
  });
}
