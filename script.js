// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let uid = null;

// 익명 로그인
firebase.auth().signInAnonymously().then(userCredential => {
  uid = userCredential.user.uid;
  console.log("내 UID:", uid);
  setupChatListener();
});

// 채팅 메시지 전송
function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (text === "") return;
  database.ref("messages").push({
    uid: uid,
    text: text,
    time: Date.now()
  });
  input.value = "";
}

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
