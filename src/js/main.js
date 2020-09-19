'use strict';

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var pcConstraint;
var dataConstraint;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function enableStartButton() {
  startButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

//====================================room==============================================

var localSignalSocket;
var remoteSignalSocket;

// enter room number
window.room = prompt("Enter room name:");
// connection signaling server
var localSignalSocket = io.connect("10.221.68.42:20000");

localSignalSocket.on('created', function(room, clientId) {
  isInitiator = true;
});

localSignalSocket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

localSignalSocket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
});

localSignalSocket.on('answer', function(message) {
	
	if(message) {
	  // 设置远端
	  localConnection.setRemoteDescription(new RTCSessionDescription(message));
	}
});


localSignalSocket.on('new-ice-candidate', function(message) {
	
	console.log('message.iceCandidate' + message);
	if(message) {
		// 添加远端icecandidate
		localConnection.addIceCandidate(new RTCIceCandidate(message)); 
	} 	
});

localSignalSocket.on('message', function(message) {
  
});

localSignalSocket.on('joined', function(room, clientId) {
  
  isInitiator = false;
});

localSignalSocket.on('log', function(array) {
  console.log.apply(console, array);
});

// enter room number
window.room = prompt("Enter room name:");
// connection signaling server
var remoteSignalSocket = io.connect("10.221.68.42:20000");
  
remoteSignalSocket.on('created', function(room, clientId) {
  isInitiator = true;
});

remoteSignalSocket.on('full', function(room) {
  console.log('Message from client: Room ' + room + ' is full :^(');
});

remoteSignalSocket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is ' + ipaddr);
});

remoteSignalSocket.on('offer', function(message) {
	
	if(message) {
		
	  // 设置远端
	   remoteConnection.setRemoteDescription(new RTCSessionDescription(message));
	  //remoteConnection.setRemoteDescription(message.offer);
	  // 设置本地并回复
	  
	  remoteConnection.createAnswer().then(function(answer) {
			remoteConnection.setLocalDescription(answer);
			remoteSignalSocket.emit('answer', answer);
      })	  
	}
});

remoteSignalSocket.on('answer', function(message) {
	
	console.log('message.answer');
	
	if(message) {
		// 接收到远端的回复，并设置
		const remoteDesc = new RTCSessionDescription(message);
		remoteConnection.setRemoteDescription(remoteDesc);	
	}
});


remoteSignalSocket.on('new-ice-candidate', function(message) {
	
	console.log('message.iceCandidate' + message);
	
	if(message) {
		
		console.log('remoteSignalSocket.on(\'new-ice-candidate\', function(message))' + message);
		// 添加远端icecandidate
		const newIceCandidate = new RTCIceCandidate(message);
		remoteConnection.addIceCandidate(newIceCandidate);
	}	
});

remoteSignalSocket.on('message', function(message) {
});

remoteSignalSocket.on('joined', function(room, clientId) {
  isInitiator = false;
});

remoteSignalSocket.on('log', function(array) {
  console.log.apply(console, array);
});


function createConnection() {
	
  dataChannelSend.placeholder = '';
  //var servers = null;
  // ice服务器的地址列表
  var servers = {'iceServers': [{'urls': 'stun:stun.zhaojianli.com'}]}
  
  pcConstraint = null;
  dataConstraint = null;
  trace('Using SCTP based data channels');
  // For SCTP, reliable and ordered delivery is true by default.
  // Add localConnection to global scope to make it visible
  // from the browser console.
  window.localConnection = localConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created local peer connection object localConnection');

  sendChannel = localConnection.createDataChannel('sendDataChannel',
      dataConstraint);
  trace('Created send data channel');

  localConnection.onicecandidate = iceCallback1;
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  // Add remoteConnection to global scope to make it visible
  // from the browser console.
  window.remoteConnection = remoteConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created remote peer connection object remoteConnection');

  remoteConnection.onicecandidate = iceCallback2;
  remoteConnection.ondatachannel = receiveChannelCallback;
  
   //const offer = localConnection.createOffer();
   //await localConnection.setLocalDescription(offer);
   //signalSocket.send({'offer': offer});

  localConnection.createOffer().then(
    gotDescription1, 				// 成功回调
    onCreateSessionDescriptionError // 错误回调
  );
  
  startButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function sendData() {
	
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data);
}

function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

function gotDescription1(desc) {
	
  localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  localSignalSocket.emit('offer', desc);
  
  
/*   // 发送到远端，并设置
  remoteConnection.setRemoteDescription(desc);
  // 回复
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  ); */
}

/* function gotDescription2(desc) {
	
  remoteConnection.setLocalDescription(desc);
  trace('Answer from remoteConnection \n' + desc.sdp);
  localConnection.setRemoteDescription(desc);
} */

function iceCallback1(event) {
	
  trace('local ice callback');
  if (event.candidate) {
	  
    console.log('iceCallback1' + event.candidate);
	localSignalSocket.emit('new-ice-candidate', event.candidate);
	
/*     remoteConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    trace('Local ICE candidate: \n' + event.candidate.candidate); */
  }
}

function iceCallback2(event) {
	
  trace('remote ice callback');
  if (event.candidate) {
	 
	console.log('iceCallback2' + event.candidate);
	remoteSignalSocket.emit('new-ice-candidate', event.candidate);
	
/*     localConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    trace('Remote ICE candidate: \n ' + event.candidate.candidate); */
  }
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event) {
	
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  // 给channel注册相应的回调
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
	
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
	  
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
	
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
	
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}

function trace(text) {
	
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
