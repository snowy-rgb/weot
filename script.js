// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let uid = null;

// 로그인 후 실행
firebase.auth().signInAnonymously().then(() => {
  generateAndRegisterUser();
});

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

const simpleUID = generateSimpleUID();
const realUID = firebase.auth().currentUser.uid;

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

function generateSimpleUID() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}





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

async function connectToUser(myCode, partnerCode) {
  // 나와 상대방의 연결 상태 기록
  await firestore.collection("users").doc(myCode).update({ connectedTo: partnerCode });
  await firestore.collection("users").doc(partnerCode).update({ connectedTo: myCode });

  const chatId = makeChatId(myCode, partnerCode);  // 아래 함수 참고
  startChat(chatId);
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

function sendMessage(chatId, text, fromUid) {
  firestore.collection("chats").doc(chatId).collection("messages").add({
    text: text,
    from: fromUid,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
}

