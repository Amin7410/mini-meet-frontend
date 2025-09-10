const ws = new WebSocket(window.SIGNALING_SERVER);
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: [ "stun:hk-turn1.xirsys.com" ] },
    {
      username: "VbQ2uqFnKNi_OXlCe8isbSgLip3dUz92pgwJzn13pbrL2apaKcafouPxLVFT-SnIAAAAAGjBonhBbWlu",
      credential: "6100b5ee-8e60-11f0-922c-0242ac120004",
      urls: [
        "turn:hk-turn1.xirsys.com:80?transport=udp",
        "turn:hk-turn1.xirsys.com:3478?transport=udp",
        "turn:hk-turn1.xirsys.com:80?transport=tcp",
        "turn:hk-turn1.xirsys.com:3478?transport=tcp",
        "turns:hk-turn1.xirsys.com:443?transport=tcp",
        "turns:hk-turn1.xirsys.com:5349?transport=tcp"
      ]
    }
  ]
});
const localVideo = document.getElementById("local");
const remoteVideo = document.getElementById("remote");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  });

pc.ontrack = e => {
  remoteVideo.srcObject = e.streams[0];
};

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
    try { await pc.addIceCandidate(msg.ice); } catch {}
  }
};

pc.onicecandidate = e => {
  if (e.candidate) ws.send(JSON.stringify({ ice: e.candidate }));
};

// tạo offer khi connect
ws.onopen = async () => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));
};
