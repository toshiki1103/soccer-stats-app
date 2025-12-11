'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import './home.css';

export default function Home() {
  const router = useRouter();
  const [showSessionInput, setShowSessionInput] = useState(false);
  const [showNewMatchSessionInput, setShowNewMatchSessionInput] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [newMatchSessionId, setNewMatchSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 既存セッションに参加
  const handleJoinSession = async (e) => {
    e.preventDefault();

    if (!sessionId.trim()) {
      alert('セッションIDを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId.trim()));

      if (sessionDoc.exists()) {
        // セッションが存在する
        router.push(`/session/${sessionId.trim()}`);
      } else {
        // セッションが存在しない → 新規作成するか確認
        const create = confirm(
          `セッション「${sessionId.trim()}」は存在しません。\n新規作成しますか？`
        );

        if (create) {
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          await setDoc(doc(db, 'sessions', sessionId.trim()), {
            sessionId: sessionId.trim(),
            name: `セッション (${dateStr})`,
            createdAt: new Date().toISOString(),
            matchIds: [],
          });

          router.push(`/session/${sessionId.trim()}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('セッションの確認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 新しい試合を記録（セッション選択）
  const handleNewMatchWithSession = async (e) => {
    e.preventDefault();

    if (!newMatchSessionId.trim()) {
      alert('セッションIDを入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const sessionDoc = await getDoc(doc(db, 'sessions', newMatchSessionId.trim()));

      if (sessionDoc.exists()) {
        // セッションが存在する
        router.push(`/session/${newMatchSessionId.trim()}?action=new`);
      } else {
        // セッションが存在しない → 新規作成
        const create = confirm(
          `セッション「${newMatchSessionId.trim()}」は存在しません。\n新規作成しますか？`
        );

        if (create) {
          const now = new Date();
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          await setDoc(doc(db, 'sessions', newMatchSessionId.trim()), {
            sessionId: newMatchSessionId.trim(),
            name: `セッション (${dateStr})`,
            createdAt: new Date().toISOString(),
            matchIds: [],
          });

          router.push(`/session/${newMatchSessionId.trim()}?action=new`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('セッションの確認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: '#0abfff', marginBottom: '8px' }}>
          ⚽ ESP Stats ⚽
        </h1>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          試合の記録・共有
        </p>
      </div>

      {/* 新しい試合を記録 */}
      {!showNewMatchSessionInput ? (
        <button
          onClick={() => setShowNewMatchSessionInput(true)}
          className="home-button"
        >
          新しい試合を記録する
        </button>
      ) : (
        <form onSubmit={handleNewMatchWithSession} style={{ marginBottom: '12px' }}>
          <div style={{ backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '6px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
              セッションを選択
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                セッションID
              </label>
              <input
                type="text"
                placeholder="例: 20251211_tex"
                value={newMatchSessionId}
                onChange={(e) => setNewMatchSessionId(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #0abfff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowNewMatchSessionInput(false);
                  setNewMatchSessionId('');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#999',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: isLoading ? '#ccc' : '#0abfff',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? '処理中...' : '次へ'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* セッションに参加 */}
      {!showSessionInput ? (
        <button
          onClick={() => setShowSessionInput(true)}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#0099cc',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: showNewMatchSessionInput ? '0px' : '12px',
          }}
        >
          セッションに参加する
        </button>
      ) : (
        <form onSubmit={handleJoinSession} style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
              セッションID
            </label>
            <input
              type="text"
              placeholder="例: 20251211_tex"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #0099cc',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowSessionInput(false)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#999',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: isLoading ? '#ccc' : '#0099cc',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? '参加中...' : '参加'}
            </button>
          </div>
        </form>
      )}

      {/* 説明 */}
      <div style={{ backgroundColor: '#f0f8ff', padding: '16px', borderRadius: '6px', marginTop: '24px', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
        <div style={{ fontWeight: 'bold', color: '#0099cc', marginBottom: '8px' }}>使い方:</div>
        <div style={{ marginBottom: '8px' }}>
          <strong>新しい試合を記録:</strong> セッションを選択して、試合を追加・記録します
        </div>
        <div>
          <strong>セッションに参加:</strong> 既に作成されたセッションに参加して、試合を確認できます
        </div>
      </div>
    </div>
  );
}
