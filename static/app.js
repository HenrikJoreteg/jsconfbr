var pc = new RTCPeerConnection({
        iceServers: [{"url": "stun:stun.l.google.com:19302"}] //[{"url":"stun:124.124.124.2"}]
    }, {
        optional: [{"DtlsSrtpKeyAgreement": true}]
    }),
    localVideoEl = document.getElementById('local'),
    remoteVideoEl = document.getElementById('remote'),
    callButton = document.getElementById('call'),
    input = document.getElementById('who'),
    localUser = location.hash.slice(1),
    mediaConstraints = {
        mandatory: {
            OfferToReceiveAudio:true,
            OfferToReceiveVideo:true
        }
    },
    remoteUser;

// request user media
getUserMedia(
    {
        video: true,
        audio: true
    },
    function (stream) {
        window.stream = stream;
        pc.addStream(stream);
        attachMediaStream(localVideoEl, stream);
    },
    function () {
        console.log("failed to get access to local media");
    }
);


// set up socket.io connection
io = io.connect('http://localhost:3000');

// on connection, identify ourselves
io.on('connect', function () {
    console.log("logged in");
    io.emit('id', localUser);
});

// handle incoming messages
io.on('message', function (msg) {
    // store reference to remote username
    remoteUser = msg.from;

    console.log("got message", msg);

    if (msg.type === 'offer') {
        console.log("got an offer");
        pc.setRemoteDescription(new RTCSessionDescription(msg.body));
        pc.createAnswer(function (sessionDescription) {
            pc.setLocalDescription(sessionDescription);
            io.emit('message', {
                to: remoteUser,
                type: 'answer',
                from: localUser,
                body: sessionDescription
            });
        }, null, mediaConstraints);
    } else if (msg.type === 'answer') {
        console.log('setting remote description');
        pc.setRemoteDescription(new RTCSessionDescription(msg.body))
    } else if (msg.type === 'ice') {
        console.log("got candidate");
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: msg.body.label,
            candidate: msg.body.candidate
        });
        pc.addIceCandidate(candidate);
    }
});

console.log('SETTING UP CALL');

var call = function (whoToCall) {
    remoteUser = whoToCall;
    // tell our browser to describe our session
    pc.createOffer(function (sessionDescription) {
        console.log('setting local description');
        pc.setLocalDescription(sessionDescription);
        io.emit('message', {
            to: remoteUser,
            type: 'offer',
            from: localUser,
            body: sessionDescription
        });
    }, null, mediaConstraints);
};

pc.onicecandidate = function (event) {
    console.log("ice candidate created");
    if (event.candidate) {
        io.emit('message', {
            from: localUser,
            type: 'ice',
            to: remoteUser,
            body: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }
        });
    }
};

pc.onaddstream = function (event) {
    console.log("STREAM ADDED", event);
    attachMediaStream(remoteVideoEl, event.stream);
    window.remoteStream = event.stream;
};
