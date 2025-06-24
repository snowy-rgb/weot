// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const firestore = firebase.firestore();  // ❗ 이게 필요해
let uid = null;
let currentChatId = null; // 현재 활성화된 채팅방의 ID

document.addEventListener('DOMContentLoaded', () => {
      // UI 요소 참조
    const myCodeElement = document.getElementById("myCode");
    const partnerCodeInput = document.getElementById("partnerCodeInput");
    const connectButton = document.getElementById("connectButton");
    const messageInput = document.getElementById("messageInput");
    const sendMessageButton = document.getElementById("sendMessageButton");
    const messagesDiv = document.getElementById("messages");

    // 초기 UI 상태 설정
    if (myCodeElement) myCodeElement.textContent = "로그인 중...";
    if (messagesDiv) messagesDiv.innerHTML = '<p>메시지가 없습니다.</p>';

// 로그인 후 실행
firebase.auth().signInAnonymously().then(() => {
  generateAndRegisterUser();
});

function generateSimpleUID() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// 익명 로그인
firebase.auth().signInAnonymously().then(userCredential => {
  const realUID = userCredential.user.uid;
  uid = realUID;

  console.log("익명 로그인 성공! Firebase UID:", realUID);

  const simpleUID = generateSimpleUID();
  firestore.collection("users").doc(simpleUID).set({
    realUid: realUID,
    connectedTo: null
  }).then(() => {
    console.log("등록 완료! 내 코드:", simpleUID);
    document.getElementById("myCode").textContent = simpleUID;

    // 이제 채팅 시작 가능!
    setupChatListener();
  });
});

  if (connectButton && partnerCodeInput) {
        connectButton.addEventListener('click', async () => {
            if (!uid) {
                alert("로그인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
                return;
            }

            const myCode = myCodeElement ? myCodeElement.textContent : null;
            const partnerCode = partnerCodeInput.value.trim();

            if (!myCode || myCode === "로딩 중..." || myCode === "로그인 실패") {
                alert("아직 내 코드가 생성되지 않았습니다. 잠시만 기다려주세요.");
                return;
            }
            if (!partnerCode) {
                alert("상대방 코드를 입력해주세요.");
                return;
            }

            await connectToUser(myCode, partnerCode);
        });
    }

      // 3. '보내기' 버튼 이벤트 리스너 (이름 sendChatMessage로 변경, Realtime DB 코드 제거)
    if (sendMessageButton) {
        sendMessageButton.addEventListener('click', sendChatMessage);
    }
    // Enter 키로 메시지 전송 기능 추가
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});



  
async function generateAndRegisterUser() {
  const simpleUID = generateSimpleUID();
  const realUID = firebase.auth().currentUser.uid;

  await firestore.collection("users").doc(simpleUID).set({
    realUid: realUID,
    connectedTo: null
  });

  console.log("등록 완료! 내 코드:", simpleUID);
  document.getElementById("myCode").textContent = simpleUID;
}

function sendMessage() { // sendMessage 대신 이 이름을 사용하세요.
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    // 1. 메시지 내용 유효성 검사
    if (text === "") {
        alert("보낼 메시지를 입력해주세요.");
        return;
    }

    // 2. 로그인 상태 (uid) 확인
    if (uid === null) {
        alert("로그인이 완료되지 않아 메시지를 보낼 수 없습니다. 잠시 후 다시 시도해주세요.");
        console.error("Firebase UID가 아직 설정되지 않았습니다.");
        return;
    }

    // 3. 채팅 연결 상태 (currentChatId) 확인
    if (currentChatId === null) {
        alert("채팅 상대방과 먼저 연결해주세요.");
        console.error("현재 활성화된 채팅방이 없습니다.");
        return;
    }

    // Firestore에 메시지 추가 (chatId와 from은 함수 내부에서 사용 가능한 변수로 대체)
    firestore.collection("chats").doc(currentChatId).collection("messages").add({
        text: text,     // 사용자가 입력한 메시지
        from: uid,      // 로그인한 사용자의 UID (전역 uid 변수 사용)
        time: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        input.value = ""; // 메시지 전송 성공 후 입력 필드 초기화
    }).catch(error => {
        console.error("Firestore 메시지 전송 중 오류 발생:", error);
        alert("메시지 전송에 실패했습니다. 콘솔을 확인해주세요.");
    });
}



//  채팅 메시지 전송
// function sendMessage() {
//     const input = document.getElementById("messageInput");
//     const text = input.value.trim();
//     if (text === "") return;

//       if (!text || typeof text !== 'string' || text.trim() === '') {
//         console.error("Firestore에 전송할 메시지 내용이 유효하지 않습니다:", text);
//         alert("보낼 메시지 내용을 입력해주세요.");
//         return; // 유효하지 않은 메시지는 전송하지 않음
//     }
//     if (!fromUid) {
//         console.error("Firestore에 전송할 메시지의 fromUid가 누락되었습니다.");
//         return;
//     }


//     // uid가 null인 경우 메시지 전송을 방지
//     if (uid === null) {
//         console.error("Firebase UID가 아직 설정되지 않았습니다. 잠시 후 다시 시도해주세요.");
//         alert("로그인이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
//         return;
//     }
//       if (!fromUid) {
//         console.error("Firestore에 전송할 메시지의 fromUid가 누락되었습니다.");
//         return;
//     }

//     firestore.collection("chats").doc(chatId).collection("messages").add({
//         text: text.trim(), // text가 undefined가 되지 않도록 방어하고, 공백 제거
//         from: fromUid,
//         time: firebase.firestore.FieldValue.serverTimestamp()
//     }).catch(error => {
//         console.error("Firestore 메시지 전송 중 오류 발생:", error);
//     });

//     database.ref("messages").push({
//         uid: uid, // 이 uid가 null이면 오류 발생
//         text: text,
//         time: Date.now()
//     });
//     input.value = "";
// }

// 실시간 메시지 표시
function setupChatListener() {
  const messagesDiv = document.getElementById("messages");
  database.ref("messages").on("child_added", snapshot => {
    const msg = snapshot.val();
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `[${msg.uid.slice(0, 6)}] ${msg.text}`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

async function connectToUser(myCode, partnerCode) {
    // 나와 상대방의 연결 상태를 Firestore에 기록
    try {
        await firestore.collection("users").doc(myCode).update({ connectedTo: partnerCode });
        await firestore.collection("users").doc(partnerCode).update({ connectedTo: myCode });

        currentChatId = makeChatId(myCode, partnerCode); // 전역 변수 currentChatId에 값 할당!
        console.log("채팅방 ID:", currentChatId);
        startFirestoreChatListener(currentChatId); // Firestore 채팅 리스너 시작
        alert(`상대방 (${partnerCode})과 연결되었습니다!`);
    } catch (error) {
        console.error("사용자 연결 중 오류 발생:", error);
        alert("사용자 연결에 실패했습니다. 상대방 코드를 다시 확인해주세요.");
    }
}


function makeChatId(a, b) {
  return [a, b].sort().join("_"); // 항상 같은 이름으로
}

function startChat(chatId) {
  const messagesRef = firestore.collection("chats").doc(chatId).collection("messages");

  messagesRef.orderBy("time").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const msg = change.doc.data();
        showMessage(msg);
      }
    });
  });
}

// function sendMessage(chatId, text, fromUid) {
//   firestore.collection("chats").doc(chatId).collection("messages").add({
//     text: text,
//     from: fromUid,
//     time: firebase.firestore.FieldValue.serverTimestamp()
//   });
// }

