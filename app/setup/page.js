'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateMatchId, addMatchToStorage } from '@/lib/utils';
import Link from 'next/link';
import './setup.css';

export default function Setup() {
  const router = useRouter();
  const [data, setData] = useState({ title: '', teamA: 'ESP', teamB: '' });

  const handleKickOff = async (e) => {
    e.preventDefault();
    if (!data.title || !data.teamA || !data.teamB) {
      alert('すべて入力してください');
      return;
    }

    try {
      const matchId = generateMatchId();
      await setDoc(doc(db, 'matches', matchId), {
        matchId,
        createdAt: serverTimestamp(),
        title: data.title,
        teamA: data.teamA,
        teamB: data.teamB,
        scoreA: 0,
        scoreB: 0,
        stats: { teamA_shoot: 0, teamA_ck: 0, teamB_shoot: 0, teamB_ck: 0 },
        timer: { startTime: Date.now(), pausedAt: null, elapsedSeconds: 0 },
        goals: [],
      });
      addMatchToStorage(matchId);
      router.push(`/match/${matchId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('試合の作成に失敗しました');
    }
  };

  return (
    <div className="setup-container">
      <Link href="/" className="setup-back-link">
        ← 戻る
      </Link>

      <h1 className="setup-title">試合設定</h1>

      <form onSubmit={handleKickOff} className="setup-form">
        <div className="setup-form-group">
          <label className="setup-label">試合名 *</label>
          <input
            type="text"
            placeholder="TM 1本目、決勝戦など"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="setup-input"
          />
        </div>

        <div className="setup-form-group">
          <label className="setup-label">自チーム名 *</label>
          <input
            type="text"
            placeholder="自分たちのチーム名"
            value={data.teamA}
            onChange={(e) => setData({ ...data, teamA: e.target.value })}
            className="setup-input"
          />
        </div>

        <div className="setup-form-group">
          <label className="setup-label">相手チーム名 *</label>
          <input
            type="text"
            placeholder="相手チームの名前"
            value={data.teamB}
            onChange={(e) => setData({ ...data, teamB: e.target.value })}
            className="setup-input"
          />
        </div>

        <button type="submit" className="setup-button">
          KICK OFF
        </button>
      </form>
    </div>
  );
}
