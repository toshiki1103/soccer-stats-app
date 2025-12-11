'use client';
import { useState } from 'react';
import './GoalModal.css';

export default function GoalModal({ team, teamName, onClose, onSave }) {
  const [scorer, setScorer] = useState('');
  const [assist, setAssist] = useState('');

  const handleSave = () => {
    if (!scorer.trim()) {
      alert('得点者名を入力してください');
      return;
    }
    onSave(scorer, assist);
    setScorer('');
    setAssist('');
  };

  return (
    <div className="goal-modal-overlay">
      <div className="goal-modal-content">
        <h2 className="goal-modal-title">{teamName} - 得点入力</h2>

        <div className="goal-modal-form-group">
          <label className="goal-modal-label">得点者名 *</label>
          <input
            type="text"
            placeholder="選手名"
            value={scorer}
            onChange={(e) => setScorer(e.target.value)}
            autoFocus
            className="goal-modal-input"
          />
        </div>

        <div className="goal-modal-form-group">
          <label className="goal-modal-label">アシスト者名（省略可）</label>
          <input
            type="text"
            placeholder="選手名"
            value={assist}
            onChange={(e) => setAssist(e.target.value)}
            className="goal-modal-input"
          />
        </div>

        <div className="goal-modal-buttons">
          <button
            onClick={onClose}
            className="goal-modal-button goal-modal-button-cancel"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="goal-modal-button goal-modal-button-save"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
