import { useState, useEffect, createContext } from "react";
import { Routes, Route } from "react-router";
import io, { Socket } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Peer from "peerjs";

import "./App.scss";

import Room from "./pages/Room/Room";
import Main from "./pages/Main/Main";
import AlreadyOnlinePage from "./pages/AlreadyOnlinePage/AlreadyOnlinePage";

import React, { FC, useMemo } from 'react';
import {useNavigate} from 'react-router'

import { useWallet } from '@solana/wallet-adapter-react';


export const peer = new Peer();

export const SocketContext = createContext<any>({});
export const PeerIDContext = createContext<any>("");
export const StreamContext = createContext<any>("");
export const WalletContext = createContext<any>("");

const App = () => {
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<string>()
  const [socket, setSocket] = useState<Socket>();
  const [peerID, setPeerID] = useState<string>();
  const [stream, setStream] = useState<string>();

  const [canPlay, setCanPlay] = useState(true)

  const { publicKey } = useWallet();

  const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

  useEffect(() => {
    if(wallet && base58) return
    
    if(socket && base58){
      console.log("Checking reconnect...")
      socket.emit("check-reconnect", base58)
      socket.on("rejoin-room", (roomID: string) => {
        console.log("Room can be rejoined")
        navigate(`room/${roomID}`)
      })
      socket.on("already-online", () => {
        navigate("already-online")
      })
    }

    setWallet(base58)
  })

  useEffect(() => {
    if (socket) return;

    const connect = async () => {
      try {
        const receivedSocket = io("http://localhost:4000");

        setSocket(receivedSocket);
      } catch (e) {
        toast("Server error occured...");
      }
    };

    connect();

    peer.on("open", (id) => {
      setPeerID(id);
    });

    return () => {
      socket!.disconnect();
    }; // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const connectDevices = async () => {
      let stream: any = "";
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (e) {
        console.log(e);
      }

      setStream(stream);
    };

    connectDevices();
  }, []);

  // if !stream return a div with information to connect camera and/or audio
  return (
    <div className="app">
      <WalletContext.Provider value={wallet}>
        <StreamContext.Provider value={stream}>
          <PeerIDContext.Provider value={peerID}>
            <SocketContext.Provider value={socket}>
              <Routes>
                <Route path="/" element={<Main></Main>} />
                <Route path="/room/:roomID" element={<Room></Room>} />
                <Route path="/already-online" element={<AlreadyOnlinePage></AlreadyOnlinePage>} />
              </Routes>
              <ToastContainer />
            </SocketContext.Provider>
          </PeerIDContext.Provider>
        </StreamContext.Provider>
      </WalletContext.Provider>
    </div>
  );
};

export default App;
