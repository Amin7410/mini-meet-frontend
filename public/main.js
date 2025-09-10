const ws = new WebSocket(window.SIGNALING_SERVER);
const pc = new RTCPeerConnection();

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
