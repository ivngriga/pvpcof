import React, { useContext, useState } from "react";
import { useNavigate } from "react-router";
import { SocketContext, PeerIDContext, StreamContext, WalletContext } from "../../../App";

import {WalletMultiButton} from '@solana/wallet-adapter-react-ui'

import styles from "./RoomForms.module.scss";

import Button from "../../UI/Button/Button";
import AmountRadio from "../../UI/AmountRadio/AmountRadio";

import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useCallback } from 'react';

const RoomForms = () => {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const peerID = useContext(PeerIDContext);
  const wallet = useContext(WalletContext)

  const [listening, setListening] = useState(false)

  const [searching, setSearching] = useState(false)

  const [amount, setAmount] = useState(0.1);

  const [isError, setIsError] = useState<boolean>(false);

  const [canCancel, setCanCancel] = useState(false)

  const findGameHandler = (e?: React.SyntheticEvent<EventTarget>) => {
    e && e.preventDefault();
    if(!wallet || !socket) return;

    try {
      socket.emit("find-room", wallet, amount);
      setSearching(true)

      if(!listening){
        socket.on("room-found", (roomID: string)=>{
          setSearching(false)
          setCanCancel(false)

          

          navigate(`room/${roomID}`)
        })
        socket.on("already-searching", () => {
          setSearching(false)
          alert("Search failed - you are currently searching/playing in another tab!")
        })
        socket.on("can-cancel", () => {
          setCanCancel(true)
        })
        setListening(true)
      }
    } catch (e) {
      console.log(e);
      setIsError(true);
      setSearching(false);
    }
  }

  /////

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const sendToRandomAddress = useCallback(async () => {
      if (!publicKey) throw new WalletNotConnectedError();

      // 890880 lamports as of 2022-09-01
      console.log(amount)
      const lamports = amount * LAMPORTS_PER_SOL;
      console.log(lamports)

      const transaction = new Transaction().add(
          SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: new PublicKey("GNavHyRCaZvcxcA9BvGmjQgGv5LgkpPdHiVaQoVfRNXj") ,
              lamports: lamports
          })
      );

      const {
          context: { slot: minContextSlot },
          value: { blockhash, lastValidBlockHeight }
      } = await connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(transaction, connection, { minContextSlot });

      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

      findGameHandler()
  }, [publicKey, sendTransaction, connection, amount]);

  const handleAmountChange = (newAmount: number) => {
    console.log(newAmount)
    setAmount(newAmount);
  }

  const cancelSearch = () => {
    socket.emit("cancel-search")
    setSearching(false)
    setCanCancel(false)
  }

  /////

  return (
    <div className={styles.forms}> 
      <>
        {wallet ? (searching ? (
          <>
            <Button disabled={true}>Searching...</Button>
            {canCancel ? (<Button onClick={cancelSearch}> Cancel Search </Button>) : (<></>)}
          </>
          
        ) : (
          <>
            <Button onClick={sendToRandomAddress}>Find Game</Button>
            <AmountRadio onChange={handleAmountChange}></AmountRadio>
            <WalletMultiButton></WalletMultiButton>
          </>
        )) : (<></>)}
      </>
      {isError && <span>Server error occured...</span>}
    </div>
  );
};

export default RoomForms;
