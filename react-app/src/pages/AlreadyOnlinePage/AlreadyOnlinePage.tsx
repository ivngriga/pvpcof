import styles from "./AlreadyOnlinePage.module.scss";

import { useNavigate } from 'react-router'
import { useContext, useEffect } from "react";
import { SocketContext, WalletContext } from "../../App";



const AlreadyOnlinePage = () => {
    const socket = useContext(SocketContext);
    const wallet = useContext(WalletContext);
    const navigate = useNavigate()

    useEffect(() => {
        if(!socket) return

        socket.emit("check-online", wallet)
        socket.on("not-online", () => {
            navigate("/")
        })
    }, [socket])

    return (
        <div className={styles.main_text}>
            You are already online in another tab. Finish playing/searching there or reload this tab.
        </div>
    )
}
export default AlreadyOnlinePage