'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatTime, getStoredMatches } from '@/lib/utils';
import GoalModal from '@/components/GoalModal';

export default function Match() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id;
  const [match, setMatch] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTeam, setGoalTeam] = useState('');
  const [error, setError] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!matchId) {
      console.log('No matchId found');
      return;
    }
    
    console.log('Loading match:', matchId);
    
    const unsubscribe = onSnapshot(
      doc(db, 'matches', matchId),
      (snap) => {
        console.log('Snapshot received:', snap.exists());
        if (snap.exists()) {
          const data = snap.data();
          console.log('Match data:', data);
          console.log('Stats:', data.stats);
          console.log('SessionId:', data.sessionId);
          setMatch(data);
          setSessionId(data.sessionId); // セッションIDを取得
          setTimer(data.timer?.elapsedSeconds || 0);
          setIsFinished(data.finished || false);
          const stored = getStoredMatches();
          setIsAdmin(stored.includes(matchId));
        } else {
          console.error('Document does not exist:', matchId);
          setError('試合が見つかりません');
        }
      },
      (error) => {
        console.error('Firestore error:', error);
        setError('データの読み込みに失敗しました: ' + error.message);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    if (!isRunning || !isAdmin || !match || isFinished) return;
    
    const interval = setInterval(async () => {
      const newTime = timer + 1;
      setTimer(newTime);
      try {
        await updateDoc(doc(db, 'matches', matchId), {
          'timer.elapsedSeconds': newTime,
        });
      } catch (error) {
        console.error('Timer update error:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timer, matchId, isAdmin, match, isFinished]);

  const updateStat = async (team, statType, delta) => {
    if (!isAdmin || isFinished || !match) return;
    
    try {
      const currentStats = match.stats || {};
      const fieldKey = `team${team}_${statType}`;
      const current = currentStats[fieldKey] || 0;
      const newValue = Math.max(0, current + delta);
      
      console.log(`Updating stats.${fieldKey} from ${current} to ${newValue}`);
      console.log('Current stats object:', currentStats);
      
      const updatedStats = {
        ...currentStats,
        [fieldKey]: newValue,
      };
      
      console.log('Updated stats object:', updatedStats);
      
      await updateDoc(doc(db, 'matches', matchId), {
        stats: updatedStats,
      });
      console.log('Stat updated successfully');
    } catch (error) {
      console.error('Stat update error:', error);
      alert('統計の更新に失敗しました: ' + error.message);
    }
  };

  const updateGoal = async (team, delta) => {
    if (!isAdmin || isFinished || !match) return;
    
    try {
      const scoreField = team === 'A' ? 'scoreA' : 'scoreB';
      const current = team === 'A' ? match.scoreA : match.scoreB;
      const newValue = Math.max(0, current + delta);
      
      console.log(`Updating ${scoreField} from ${current} to ${newValue}`);
      
      await updateDoc(doc(db, 'matches', matchId), {
        [scoreField]: newValue,
      });
      console.log('Goal updated successfully');
    } catch (error) {
      console.error('Goal update error:', error);
      alert('スコアの更新に失敗しました: ' + error.message);
    }
  };

  const handleGoal = async (scorer, assist, team) => {
    const time = formatTime(timer);
    try {
      const newScore = team === 'A' ? match.scoreA + 1 : match.scoreB + 1;
      
      await updateDoc(doc(db, 'matches', matchId), {
        [team === 'A' ? 'scoreA' : 'scoreB']: newScore,
        goals: [...(match.goals || []), { time, team, scorer, assist }],
      });
      setShowGoalModal(false);
    } catch (error) {
      console.error('Goal save error:', error);
      alert('得点の記録に失敗しました: ' + error.message);
    }
  };

  const copyToClipboard = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    alert('URLをコピーしました');
  };

  const finishMatch = async () => {
    if (!confirm('試合を終了しますか？')) return;
    
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        finished: true,
        finishedAt: new Date().toISOString(),
      });
      setIsFinished(true);
      alert('試合を終了しました');
    } catch (error) {
      console.error('Finish match error:', error);
      alert('試合終了に失敗しました');
    }
  };

  const handleGoBack = () => {
    if (sessionId) {
      // セッションがあれば、セッションページに戻る
      router.push(`/session/${sessionId}`);
    } else {
      // セッションがなければ、トップに戻る
      router.push('/');
    }
  };

  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>エラー: {error}</div>;
  if (!match) return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>読み込み中...</div>;

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={handleGoBack}
          style={{
            backgroundColor: 'transparent',
            color: '#0abfff',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
          }}
        >
          ← 戻る
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>{match.title}</h1>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Timer */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0abfff', marginBottom: '12px' }}>{formatTime(timer)}</div>
        {isAdmin && !isFinished && (
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '8px 24px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: isRunning ? '#ef4444' : '#22c55e',
              color: 'white',
            }}
          >
            {isRunning ? '一時停止' : '再開'}
          </button>
        )}
        {isFinished && (
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>試合終了</div>
        )}
      </div>

      {/* Scoreboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '12px',
        marginBottom: '32px',
        backgroundColor: '#f0f8ff',
        padding: '16px',
        borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px' }}>{match.teamA}</div>
          {isAdmin && !isFinished ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => updateGoal('A', -1)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0099cc',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                -
              </button>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0abfff', minWidth: '60px' }}>{match.scoreA}</div>
              <button
                onClick={() => updateGoal('A', 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0099cc',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                +
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0abfff' }}>{match.scoreA}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#0099cc' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px' }}>{match.teamB}</div>
          {isAdmin && !isFinished ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={() => updateGoal('B', -1)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0099cc',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                -
              </button>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0abfff', minWidth: '60px' }}>{match.scoreB}</div>
              <button
                onClick={() => updateGoal('B', 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0099cc',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                +
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0abfff' }}>{match.scoreB}</div>
          )}
        </div>
      </div>

      {/* Stats */}
      {isAdmin ? (
        <>
          {/* Admin Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[['A', match.teamA], ['B', match.teamB]].map(([team, name]) => (
              <div key={team} style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '8px' }}>
                <h3 style={{ fontWeight: 'bold', color: '#0066cc', marginBottom: '12px', fontSize: '16px' }}>{name}</h3>
                
                {!isFinished && (
                  <>
                    <button
                      onClick={() => { setGoalTeam(team); setShowGoalModal(true); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#0abfff',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      得点
                    </button>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button
                        onClick={() => updateStat(team, 'shoot', 1)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#00a8e8',
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        シュート: +1
                      </button>
                      <button
                        onClick={() => updateStat(team, 'shoot', -1)}
                        style={{
                          width: '48px',
                          padding: '12px',
                          backgroundColor: '#0088bb',
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        -1
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <button
                        onClick={() => updateStat(team, 'ck', 1)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#0099cc',
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        コーナーキック: +1
                      </button>
                      <button
                        onClick={() => updateStat(team, 'ck', -1)}
                        style={{
                          width: '48px',
                          padding: '12px',
                          backgroundColor: '#007799',
                          color: 'white',
                          fontWeight: 'bold',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        -1
                      </button>
                    </div>
                  </>
                )}

                <div style={{ fontSize: '12px', color: '#0066cc', marginTop: '8px', backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }}>
                  <div>シュート: {match.stats?.[`team${team}_shoot`] || 0}</div>
                  <div>コーナーキック: {match.stats?.[`team${team}_ck`] || 0}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={copyToClipboard}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0099cc',
              color: 'white',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            📋 URLをコピー (LINE共有用)
          </button>

          {!isFinished && (
            <button
              onClick={finishMatch}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                marginBottom: '24px',
                cursor: 'pointer',
              }}
            >
              ✓ 試合終了
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#0099cc', marginBottom: '24px' }}>📖 閲覧モード</div>
      )}

      {/* Goals */}
      {match.goals?.length > 0 && (
        <div style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '8px' }}>
          <h3 style={{ fontWeight: 'bold', color: '#0066cc', marginBottom: '12px' }}>得点履歴</h3>
          {match.goals.map((g, i) => (
            <div key={i} style={{ fontSize: '14px', color: '#0066cc', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #ddd' }}>
              <span style={{ fontWeight: 'bold', color: '#0abfff' }}>{g.time}</span> - {g.team === 'A' ? match.teamA : match.teamB}: {g.scorer} {g.assist && `(assist: ${g.assist})`}
            </div>
          ))}
        </div>
      )}

      {showGoalModal && isAdmin && !isFinished && (
        <GoalModal
          team={goalTeam}
          teamName={goalTeam === 'A' ? match.teamA : match.teamB}
          onClose={() => setShowGoalModal(false)}
          onSave={(scorer, assist) => handleGoal(scorer, assist, goalTeam)}
        />
      )}
    </div>
  );
}
