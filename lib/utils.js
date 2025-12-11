export const generateMatchId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getStoredMatches = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('matchIds');
  return stored ? JSON.parse(stored) : [];
};

export const addMatchToStorage = (matchId) => {
  if (typeof window === 'undefined') return;
  const matches = getStoredMatches();
  if (!matches.includes(matchId)) {
    matches.push(matchId);
    localStorage.setItem('matchIds', JSON.stringify(matches));
  }
};
