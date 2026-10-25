"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./ChatMvpClient.module.css";

type Participant = { userId: number; online: boolean; revision: number; pending: number };

export default function LuxMember({channelId,onMention,onReply}:{channelId:number;onMention:()=>void;onReply:()=>void}) {
  const [participant,setParticipant] = useState<Participant|null>(null);
  const [notice,setNotice] = useState("");
  const [confirmReset,setConfirmReset] = useState(false);
  const [resetting,setResetting] = useState(false);
  const onReplyRef = useRef(onReply);
  useEffect(() => { onReplyRef.current = onReply; },[onReply]);
  useEffect(() => {
    let stopped = false;
    let timer:ReturnType<typeof setTimeout>;
    let revision:number|undefined;
    async function poll() {
      try {
        const response = await fetch(`/api/chat/lux?channelId=${channelId}`,{cache:"no-store",signal:AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (stopped) return;
        setParticipant(payload.participant);
        const next = Number(payload.participant?.revision || 0);
        if (next && revision !== next) onReplyRef.current();
        revision = next;
      } catch { if (!stopped) setParticipant(current => current ? {...current,online:false} : null); }
      if (!stopped) timer=setTimeout(() => void poll(),4000);
    }
    void poll();
    return () => { stopped=true; clearTimeout(timer); };
  },[channelId]);
  if (!participant) return null;
  async function forget() {
    setResetting(true);
    try {
      const response=await fetch('/api/chat/lux',{method:'DELETE',signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error();
      setNotice('Люкс забыла предыдущие разговоры с тобой. Сообщения в общем чате сохранены.');
      setConfirmReset(false);
    } catch {setNotice('Не удалось очистить память. Попробуй ещё раз.');}
    finally {setResetting(false);}
  }
  return <div>
    <button type="button" className={styles.memberCard} onClick={onMention} title="Обратиться к Люкс в этом чате">
      <span aria-hidden="true">✦</span><span className={styles.memberName}>Люкс</span>
    </button>
    <p className={styles.sidebarEmpty}>{participant.online ? participant.pending ? 'Люкс готовит ответ…' : 'На связи · напиши @Люкс' : 'Сейчас не на связи'}</p>
    {confirmReset ? <div><p>Забыть твои прошлые разговоры с Люкс?</p><button type="button" disabled={resetting} onClick={() => void forget()}>Забыть</button><button type="button" onClick={() => setConfirmReset(false)}>Отмена</button></div>
      : <button type="button" className={styles.messageAction} onClick={() => setConfirmReset(true)}>Очистить мою память</button>}
    {notice ? <p role="status" className={styles.sidebarEmpty}>{notice}</p> : null}
  </div>;
}
