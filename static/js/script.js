// 문서 준비가 완료되면 초기화 함수와 이벤트 핸들러 설정 함수를 호출
$(document).ready(function () {
  initializeTodoApp();
  setupEventHandlers();
});

// 할 일 앱 초기화: 할 일 목록이 페이지에 존재하는지 확인 후 로드
function initializeTodoApp() {
  if ($("#todo-list").length > 0) {
    loadTodos();
  }
}

// 이벤트 핸들러 설정: 폼 제출, 버튼 클릭 등의 이벤트에 대한 핸들러를 연결
function setupEventHandlers() {
  // 회원가입 폼 제출 이벤트 핸들러
  $("#register-form")
    .off("submit")
    .on("submit", function (event) {
      event.preventDefault();
      if (validateForm()) {
        // 폼 유효성 검사 후 회원가입 처리
        registerUser();
      }
    });

  // 로그인 폼 제출 이벤트 핸들러
  $("#login-form").submit(function (event) {
    event.preventDefault();
    loginUser();
  });

  // 로그아웃 버튼 클릭 이벤트 핸들러
  $("#logout-button").click(function () {
    logoutUser();
  });

  // 할 일 추가 버튼 클릭 이벤트 핸들러
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

// 사용자 등록 처리
function registerUser() {
  var userdata = {
    userid: $("#userid").val(),
    username: $("#username").val(),
    password: $("#password").val(),
  };

  $("button[type=submit]").prop("disabled", true); // 제출 버튼 비활성화

  $.ajax({
    type: "POST",
    url: "/register",
    data: userdata,
    success: function (response) {
      alert(response.msg);
      if (response.result === "success") {
        window.location.href = "/";
      } else {
        $("button[type=submit]").prop("disabled", false); // 실패 시 버튼 다시 활성화
      }
    },
    error: function () {
      alert("서버 오류가 발생했습니다.");
      $("button[type=submit]").prop("disabled", false); // 오류 시 버튼 다시 활성화
    },
  });
}

// 사용자 ID 중복 확인
function checkUserId() {
  var userid = $("#userid").val().trim();
  $("#userid").val(userid); // 공백 제거 후 값 재설정

  if (!userid) {
    alert("사용자 ID를 입력해주세요.");
    return;
  }

  $.ajax({
    type: "POST",
    url: "/check_userid",
    data: { userid: userid },
    success: function (response) {
      if (response.isAvailable) {
        alert("사용 가능한 사용자 ID입니다.");
      } else {
        alert("이미 사용 중인 사용자 ID입니다.");
      }
    },
  });
}

// 사용자 로그인 처리
function loginUser() {
  var userid = $("#userid").val();
  var password = $("#password").val();

  $.ajax({
    type: "POST",
    url: "/login",
    data: {
      userid: userid,
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

// 사용자 로그아웃 처리
function logoutUser() {
  $.ajax({
    type: "GET",
    url: "/logout",
    success: function () {
      window.location.href = "/";
    },
  });
}

// 할 일 목록 로드
function loadTodos() {
  $.ajax({
    type: "GET",
    url: "/todo",
    dataType: "json",
    success: function (response) {
      if (response && response.result === "success" && response.todos) {
        let todos = response.todos;
        $("#todo-list").empty(); // 기존 목록 초기화
        todos.forEach(function (todo) {
          let todoHTML = createTodoHTML(todo._id, todo.title, todo.completed);
          $("#todo-list").append(todoHTML);
        });
      } else {
        console.error("Response is not as expected.");
      }
    },
    error: function (error) {
      console.error("Error while fetching todos:", error);
    },
  });
}

// 할 일 추가 처리
function addTodo(title) {
  $.ajax({
    type: "POST",
    url: "/todo",
    data: { title: title },
    success: function (response) {
      if (response.result === "success") {
        $("#todo-val").val(""); // 입력 필드 초기화
        let todoHTML = createTodoHTML(response.id, title, false);
        $("#todo-list").append(todoHTML); // 목록에 할 일 추가
        alert("할 일이 추가되었습니다.");
      }
    },
  });
}

// 할 일 HTML 생성
function createTodoHTML(id, title, completed) {
  let textDecoration = completed ? "text-decoration: line-through;" : "";
  let buttons = `
    <button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${id}')">완료</button>
    <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode('${id}', '${title}')">수정</button>
    <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>
  `;

  if (completed) {
    // 완료된 할 일인 경우 삭제 버튼만 표시
    buttons = `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${id}')">삭제</button>`;
  }

  return `
    <li class="list-group-item d-flex justify-content-between align-items-center" data-id="${id}" style="${textDecoration}">
      <span>${title}</span>
      <span>${buttons}</span>
    </li>
  `;
}

// 할 일 완료 처리
function completeTodo(id) {
  $.ajax({
    type: "POST",
    url: "/todo/complete",
    data: { id: id },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 완료되었습니다.");
        let todoItem = $(`li[data-id='${id}']`);
        todoItem.css("text-decoration", "line-through"); // 텍스트에 취소선 적용
        todoItem.find(".complete-btn, .edit-btn").hide(); // 완료 및 수정 버튼 숨김
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
    data: { id: id },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 삭제되었습니다.");
        $(`li[data-id='${id}']`).remove(); // 목록에서 해당 할 일 제거
      }
    },
    error: function (error) {
      alert("서버 요청에 실패했습니다.");
    },
  });
}

// 할 일 수정 모드 활성화
function editTodoMode(id, title) {
  let todoItem = $(`li[data-id='${id}']`);
  todoItem.html(`
    <form class="form-inline" onsubmit="updateTodo(event, '${id}')">
      <input type="text" class="form-control mr-2" value="${title}">
      <button type="submit" class="btn btn-primary">업데이트</button>
      <button type="button" class="btn btn-secondary" onclick="exitEditTodoMode('${id}', '${title}')">취소</button>
    </form>
  `);
}

// 할 일 수정 모드 종료
function exitEditTodoMode(id, title) {
  let todoItem = $(`li[data-id='${id}']`);
  todoItem.html(
    createTodoHTML(
      id,
      title,
      todoItem.css("text-decoration") === "line-through"
    )
  );
}

// 할 일 업데이트 처리
function updateTodo(event, id) {
  event.preventDefault(); // 폼 제출 기본 이벤트 방지
  let updatedTitle = $(event.target).find("input").val();

  $.ajax({
    type: "POST",
    url: `/todo/update/${id}`,
    data: {
      id: id,
      title: updatedTitle,
    },
    success: function (response) {
      if (response.result === "success") {
        alert("할 일이 업데이트 되었습니다.");
        exitEditTodoMode(id, updatedTitle); // 수정 모드 종료 및 할 일 내용 업데이트
      } else {
        alert("업데이트에 실패했습니다.");
      }
    },
  });
}
