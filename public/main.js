// Kết nối tới signaling server
const ws = new WebSocket(window.SIGNALING_SERVER);

// 🔑 Tạo RTCPeerConnection với STUN + TURN
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },   // STUN public
    {
      urls: "turn:127.0.0.1:3478",             // TURN local Docker
      username: "test",
      credential: "123456"
    }
  ]
});

// Test: add media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    // attach stream to <video> element if needed
  })
  .catch(console.error);

// Video element
const localVideo = document.getElementById("local");
const remoteVideo = document.getElementById("remote");

// 🔹 Lấy camera + mic, add track vào pc
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  });

// 🔹 Khi nhận được track từ peer
pc.ontrack = e => {
  remoteVideo.srcObject = e.streams[0];
};

// 🔹 Khi có ICE candidate mới
pc.onicecandidate = e => {
  if (e.candidate) {
    console.log("ICE candidate:", e.candidate.candidate);
    ws.send(JSON.stringify({ ice: e.candidate }));
  }
};

// 🔹 Khi nhận message từ signaling server
ws.onmessage = async ({ data }) => {
  const msg = JSON.parse(data);

  if (msg.offer) {
    await pc.setRemoteDescription(msg.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  } else if (msg.answer) {
    await pc.setRemoteDescription(msg.answer);
  } else if (msg.ice) {
    try { await pc.addIceCandidate(msg.ice); } catch (err) {
      console.error("Error adding ICE:", err);
    }
  }
};

// 🔹 Khi WebSocket mở → tạo offer
ws.onopen = async () => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));
};
