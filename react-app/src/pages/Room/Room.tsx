import { useParams, useNavigate } from "react-router";
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { SocketContext } from "../../App";

import styles from "./Room.module.scss";

import ChatBox from "../../components/Room/ChatBox/ChatBox";

interface Message {
  wallet: string;
  message: string;
  id: string;
}

const Room = () => {
  const socket = useContext(SocketContext);

  const navigate = useNavigate();
  const { roomID } = useParams();

  const currentRoomID = useRef("");
  const [selectedActivity, setSelectedActivity] = useState("chat");

  useEffect(() => {
    currentRoomID.current = roomID!;
  }, [roomID]);

  useEffect(() => {
    if (!roomID || !socket) {
      navigate("/");
      return;
    }

    socket.on("clear-messages", () => {
      setMessages([]);
    });

    socket.on("winner", () => {
      alert("Congrats! YOU WON! Your winnings will arrive to your wallet shortly.")
      navigate("/")
    })

    socket.on("loser", () => {
      alert("Sorry, you lost...")
      navigate("/")
    })

    return () => {
      socket.emit("disconnect-user", currentRoomID.current);
      socket.emit("clear-messages", currentRoomID.current);
      socket.removeAllListeners();
    };
  }, [roomID, socket, navigate]);

  const [messages, setMessages] = useState<Message[]>([]);

  const addMessageHandler = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  if (!socket) return <></>;

  return (
    <main
      className={`${styles.main} ${
        selectedActivity && selectedActivity !== "chat"
          ? styles.activity
          : selectedActivity === "chat"
          ? styles["chat-on"]
          : ""
      }`}
    >
      <ChatBox className={styles.chat} onNewMessage={addMessageHandler} messages={messages}></ChatBox>
    </main>
  );
};

export default Room;
