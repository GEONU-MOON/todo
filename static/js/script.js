// 문서가 준비되면 실행되는 함수
$(document).ready(function () {
  initializeTodoApp(); // 할 일 앱 초기화 함수 호출
});

// 할 일 앱을 초기화하는 함수
function initializeTodoApp() {
  loadTodos(); // 할 일 목록을 불러오는 함수 호출
}

// 할 일 목록을 불러오는 함수
function loadTodos() {
  $.ajax({
    type: "GET", // HTTP GET 요청
    url: "/todo", // 요청을 보낼 URL
    data: {}, // 전송할 데이터 (여기서는 비어 있음)
    success: function (response) {
      // 요청이 성공했을 때 실행되는 함수
      if (response["result"] == "success") {
        let todos = response["todos"]; // 응답으로 받은 할 일 목록
        $("#todo-list").empty(); // 할 일 목록을 담는 HTML 요소를 비움
        todos.forEach(function (todo) {
          // 각 할 일 항목에 대해 반복
          let todoHTML = createTodoHTML(todo["title"], todo["completed"]); // 할 일 HTML 생성
          $("#todo-list").append(todoHTML); // 생성된 HTML을 할 일 목록에 추가
        });
      }
    },
  });
}

// 할 일 HTML을 생성하는 함수
function createTodoHTML(title, completed) {
  let textDecoration = completed ? "text-decoration: line-through;" : ""; // 완료된 할 일에 취소선 스타일 적용
  let buttons = completed
    ? `<button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${title}')">삭제</button>`
    : `<button class="btn btn-success btn-sm mr-1 complete-btn" onclick="completeTodo('${title}')">완료</button>
               <button class="btn btn-secondary btn-sm mr-1 edit-btn" onclick="editTodoMode(this, '${title}')">수정</button>
               <button class="btn btn-danger btn-sm delete-btn" onclick="deleteTodo('${title}')">삭제</button>`;

  return `<li class="list-group-item d-flex justify-content-between align-items-center" style="${textDecoration}">
                    <span>${title}</span>
                    <span>${buttons}</span>
                </li>`; // 할 일 항목을 나타내는 HTML 반환
}

// 할 일 추가 버튼 클릭 이벤트 핸들러
$("#addTodoButton").click(function () {
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
});

// 할 일 완료 처리 함수
function completeTodo(title) {
  $.ajax({
    type: "POST", // HTTP POST 요청
    url: "/todo/complete", // 요청을 보낼 URL
    data: { title_give: title }, // 전송할 데이터 (완료할 할 일 제목)
    success: function (response) {
      // 요청이 성공했을 때 실행되는 함수
      if (response["result"] == "success") {
        alert("할 일 체크 완료!"); // 사용자에게 완료 알림
        loadTodos(); // 할 일 목록을 다시 불러오는 함수 호출
      }
    },
  });
}

// 할 일 삭제 함수
function deleteTodo(title) {
  $.ajax({
    type: "POST", // HTTP POST 요청
    url: "/todo/delete", // 요청을 보낼 URL
    data: { title_give: title }, // 전송할 데이터 (삭제할 할 일 제목)
    success: function (response) {
      // 요청이 성공했을 때 실행되는 함수
      if (response["result"] == "success") {
        alert("할 일 삭제 완료!"); // 사용자에게 삭제 완료 알림
        loadTodos(); // 할 일 목록을 다시 불러오는 함수 호출
      }
    },
  });
}

// 할 일 수정 모드 활성화 함수
function editTodoMode(element, title) {
  let parentLi = $(element).closest("li"); // 수정할 할 일 항목의 상위 LI 요소 찾기
  let originalText = parentLi.find("span:first").text(); // 원래 할 일 텍스트 가져오기

  let editHTML = `
            <form class="form-inline w-75" onsubmit="updateTodo(event, '${title}', '${originalText}')">
                <input type="text" class="form-control mr-2 w-75" value="${originalText}">
                <button type="submit" class="btn btn-secondary btn-sm mr-1">업데이트</button>
                <button type="button" class="btn btn-warning btn-sm" onclick="cancelEditTodoMode(this, '${originalText}')">취소</button>
            </form>`; // 수정 폼 HTML 생성

  parentLi.html(editHTML); // 할 일 항목의 HTML을 수정 폼으로 변경
}

// 할 일 업데이트 처리 함수
function updateTodo(event, originalTitle, originalText) {
  event.preventDefault(); // 기본 폼 제출 방지
  let updatedTitle = $(event.target).find("input").val(); // 수정된 할 일 제목 가져오기

  if (updatedTitle.trim() === "") {
    alert("할 일을 입력해주세요!"); // 입력값 검증
    return;
  }

  $.ajax({
    type: "POST", // HTTP POST 요청
    url: "/todo/update", // 요청을 보낼 URL
    data: {
      original_title_give: originalTitle,
      updated_title_give: updatedTitle,
    }, // 전송할 데이터 (원래 제목과 수정된 제목)
    success: function (response) {
      // 요청이 성공했을 때 실행되는 함수
      if (response["result"] == "success") {
        alert("할 일이 업데이트 되었습니다."); // 사용자에게 업데이트 완료 알림
        loadTodos(); // 할 일 목록을 다시 불러오는 함수 호출
      } else {
        alert("업데이트에 실패했습니다. 다시 시도해주세요."); // 업데이트 실패 알림
      }
    },
  });
}

// 할 일 수정 취소 함수
function cancelEditTodoMode(element, originalTitle, wasCompleted) {
  let parentLi = $(element).closest("li"); // 수정 취소할 할 일 항목의 상위 LI 요소 찾기
  let originalTodoHTML = createTodoHTML(originalTitle, wasCompleted); // 원래의 할 일 HTML 생성
  parentLi.replaceWith(originalTodoHTML); // 할 일 항목의 HTML을 원래대로 되돌림
}
