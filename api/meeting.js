import React from 'react';
import '../Meeting/Meeting.css'; // import the CSS file for styling
import { useState, useCallback, useEffect } from 'react';
import useSocket from 'use-socket.io-client';
import ReactPlayer from 'react-player';


const VideoChatApp = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(
        ({ from, ans }) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
        },
        [sendStreams]
    );

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncomming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncomming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        };
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
    ]);

    return (
        <div>
            <div className="header-meeting" >
                <div className="logo">
                    <h3>Video Chat</h3>
                </div>
            </div>
            <div className="main">
                <div className="main__left">
                    <div className="videos__group">
                        <div id="video-grid">
                            {myStream && (
                                <>
                                    <ReactPlayer
                                        playing
                                        muted
                                        height="100px"
                                        width="200px"
                                        url={myStream}
                                    />
                                </>
                            )}
                            {remoteStream && (
                                <>
                                    <ReactPlayer
                                        playing
                                        muted
                                        height="100px"
                                        width="200px"
                                        url={remoteStream}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="options">
                        <div className="options__left">
                            <div id="stopVideo" className="options__button">
                                <i className="ri-live-line"></i>
                            </div>
                            <div id="muteButton" className="options__button">
                                <i className="ri-mic-line"></i>
                            </div>
                        </div>
                        <div className="options__right">
                            <div id="endCallButton" className="options__button">
                                <i className="ri-phone-line"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="main__right">
                    <div className="main__chat_window">
                        <div className="messages"></div>
                    </div>
                    <div className="main__message_container">
                        <input
                            id="chat_message"
                            type="text"
                            autoComplete="off"
                            placeholder="Type message here..."
                        />
                        <div id="send" className="options__button">
                            <i className="ri-send-plane-line" aria-hidden="true"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoChatApp;



//backend logic
// io.on("connection", (socket) => {
//   console.log(`Socket Connected`, socket.id);
//   socket.on("room:join", (data) => {
//     const { email, room } = data;
//     emailToSocketIdMap.set(email, socket.id);
//     socketidToEmailMap.set(socket.id, email);
//     io.to(room).emit("user:joined", { email, id: socket.id });
//     socket.join(room);
//     io.to(socket.id).emit("room:join", data);
//   });

//   socket.on("user:call", ({ to, offer }) => {
//     io.to(to).emit("incomming:call", { from: socket.id, offer });
//   });

//   socket.on("call:accepted", ({ to, ans }) => {
//     io.to(to).emit("call:accepted", { from: socket.id, ans });
//   });

//   socket.on("peer:nego:needed", ({ to, offer }) => {
//     console.log("peer:nego:needed", offer);
//     io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
//   });

//   socket.on("peer:nego:done", ({ to, ans }) => {
//     console.log("peer:nego:done", ans);
//     io.to(to).emit("peer:nego:final", { from: socket.id, ans });
//   });
// });