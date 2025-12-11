'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateMatchId, addMatchToStorage } from '@/lib/utils';

export default function Session() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [newMatchData, setNewMatchData] = useState({ title: '', teamA: 'ESP', teamB: '' });

  // URLパラメータをチェック（新規作成時は自動でフォームを開く）
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setShowNewMatchForm(true);
    }
  }, [searchParams]);

  // セッション情報を取得
  useEffect(() => {
    if (!sessionId) return;

    console.log('Loading session:', sessionId);

    const unsubscribe = onSnapshot(
      doc(db, 'sessions', sessionId),
      async (snap) => {
        if (snap.exists()) {
          const sessionData = snap.data();
          console.log('Session data:', sessionData);
          setSession(sessionData);

          // セッション内のマッチを取得
          if (sessionData.matchIds && sessionData.matchIds.length > 0) {
            const matchesData = [];
            for (const matchId of sessionData.matchIds) {
              const matchSnap = await getDoc(doc(db, 'matches', matchId));
              if (matchSnap.exists()) {
                matchesData.push({
                  id: matchId,
                  ...matchSnap.data(),
                });
              }
            }
            setMatches(matchesData);
          } else {
            setMatches([]);
          }
        } else {
          setError('セッションが見つかりません');
        }
      },
      (error) => {
        console.error('Error:', error);
        setError('セッションの読み込みに失敗しました');
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  // 新しい試合を追加
  const handleAddMatch = async (e) => {
    e.preventDefault();

    if (!newMatchData.title || !newMatchData.teamA || !newMatchData.teamB) {
      alert('すべて入力してください');
      return;
    }

    setIsCreating(true);

    try {
      const matchId = generateMatchId();

      // マッチを作成
      await setDoc(doc(db, 'matches', matchId), {
        matchId,
        sessionId,
        createdAt: new Date().toISOString(),
        title: newMatchData.title,
        teamA: newMatchData.teamA,
        teamB: newMatchData.teamB,
        scoreA: 0,
        scoreB: 0,
        stats: { teamA_shoot: 0, teamA_ck: 0, teamB_shoot: 0, teamB_ck: 0 },
        timer: { startTime: Date.now(), pausedAt: null, elapsedSeconds: 0 },
        goals: [],
      });

      // セッションにマッチIDを追加
      const currentMatchIds = session?.matchIds || [];
      await updateDoc(doc(db, 'sessions', sessionId), {
        matchIds: [...currentMatchIds, matchId],
      });

      // 管理者として登録
      addMatchToStorage(matchId);

      // 試合記録画面に遷移
      router.push(`/match/${matchId}`);

      // フォームをリセット
      setNewMatchData({ title: '', teamA: 'ESP', teamB: '' });
      setShowNewMatchForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('試合の追加に失敗しました: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const goToMatch = (matchId) => {
    router.push(`/match/${matchId}`);
  };

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        エラー: {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#0abfff', fontWeight: 'bold', textDecoration: 'none' }}>
          ← トップ
        </Link>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          {session.name}
        </h1>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* セッションID表示 */}
      <div style={{ backgroundColor: '#f0f8ff', padding: '12px', borderRadius: '6px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>セッションID</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0abfff', wordBreak: 'break-all' }}>
          {sessionId}
        </div>
      </div>

      {/* 新しい試合を追加フォーム（自動展開時）*/}
      {showNewMatchForm && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '6px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
            新しい試合を追加
          </h3>

          <form onSubmit={handleAddMatch}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                試合名
              </label>
              <input
                type="text"
                placeholder="1本目、決勝戦など"
                value={newMatchData.title}
                onChange={(e) => setNewMatchData({ ...newMatchData, title: e.target.value })}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                自チーム名
              </label>
              <input
                type="text"
                placeholder="自分たちのチーム名"
                value={newMatchData.teamA}
                onChange={(e) => setNewMatchData({ ...newMatchData, teamA: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                相手チーム名
              </label>
              <input
                type="text"
                placeholder="相手チームの名前"
                value={newMatchData.teamB}
                onChange={(e) => setNewMatchData({ ...newMatchData, teamB: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowNewMatchForm(false);
                  setNewMatchData({ title: '', teamA: 'ESP', teamB: '' });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#999',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isCreating}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isCreating ? '#ccc' : '#22c55e',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                }}
              >
                {isCreating ? '作成中...' : '試合を記録開始'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 試合一覧 */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
          試合（全{matches.length}本）
        </h2>

        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
            {showNewMatchForm ? '試合を追加しています...' : 'まだ試合がありません'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => goToMatch(match.id)}
                style={{
                  padding: '16px',
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#0abfff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                    {match.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {match.teamA} vs {match.teamB}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0abfff', textAlign: 'right' }}>
                  {match.scoreA} - {match.scoreB}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 新しい試合を追加ボタン（フォームが非表示時）*/}
      {!showNewMatchForm && (
        <button
          onClick={() => setShowNewMatchForm(true)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#22c55e',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          + 新しい試合を追加
        </button>
      )}
    </div>
  );
}
