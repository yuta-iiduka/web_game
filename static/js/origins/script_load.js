
//ammo.jsでio()が上書きされてしまうので，ammo.jsの前に実行しなければならない。
let socket = io();
//.connect('https://' + document.domain + ':' + location.port + "/");
socket.on("connect", function () {
  socket.emit("server_echo", { msg: "client connected!" });
});

socket.on("client_echo", function (data) {
  console.warn(data.user_name, data.msg);
});

socket.on("from_room", function (data) {
  console.warn(data.user_name, data.msg);
});

const join = function (room) {
  socket.emit("join", { room: room });
}

const send_room = function (room, msg) {
  socket.emit("send_room", { room: room, msg: msg });
}

//scriptの動的取得
const script_load = function (script_name) {
  socket.emit("script_load", { script_name: script_name })
}

