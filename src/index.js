import client from "rhea";

function update(data) {
  var val1 = document.getElementById("value1");
  var val2 = document.getElementById("value2");

  val1.innerHTML = data.value1;
  val2.innerHTML = data.value2;
}

client.on("message", function(context) {
  update(context.message.body);
});

var server = "ws://127.0.0.1:8080";
var ws = client.websocket_connect(WebSocket);
var connection = client.connect({
  connection_details: ws(server, ["binary"]),
  reconnect: true
});

connection.open_receiver("value_updates");
