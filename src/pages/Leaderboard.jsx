import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Gọi đúng endpoint /leaderboard (không phải /users/...)
        const res = await api.get('/leaderboard');
        setUsers(res.data);
      } catch (error) { console.error("Lỗi tải BXH"); }
    };
    fetchLeaderboard();
  }, []);

  const getRankEmoji = (index) => {
      if (index === 0) return '👑';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return `#${index + 1}`;
  };

  return (
    <div style={{ padding: '40px', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', alignSelf:'flex-start', background:'white', color:'#333' }}>⬅ Về Sảnh</button>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding:'0' }}>
        <div style={{padding:'30px', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.2)'}}>
            <h1 style={{ margin:0, fontSize:'2.5rem', textShadow:'0 4px 10px rgba(0,0,0,0.3)' }}>🏆 BẢNG XẾP HẠNG TOP 50</h1>
        </div>
        
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(0,0,0,0.3)', color: '#ffd700', position:'sticky', top:0 }}>
                <tr>
                <th style={{ padding: '20px', width: '80px', textAlign:'center' }}>Hạng</th>
                <th style={{ padding: '20px' }}>Kỳ thủ</th>
                <th style={{ padding: '20px', textAlign:'right' }}>Điểm Elo</th>
                <th style={{ padding: '20px', width:'100px' }}>Rank</th>
                </tr>
            </thead>
            <tbody>
                {users.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign:'center', padding:'30px'}}>Chưa có dữ liệu</td></tr>
                )}
                {users.map((user, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', transition:'0.2s' }}>
                    <td style={{ padding: '15px', textAlign:'center', fontSize:'1.2rem', fontWeight:'bold' }}>
                        {getRankEmoji(index)}
                    </td>
                    <td style={{ padding: '15px', fontWeight: 'bold', fontSize:'1.1rem' }}>
                        {user.username} {localStorage.getItem('username') === user.username && <span style={{fontSize:'0.8rem', color:'#4CAF50', marginLeft:'5px'}}>(Bạn)</span>}
                    </td>
                    <td style={{ padding: '15px', textAlign:'right', fontFamily:'monospace', fontSize:'1.2rem', color:'#4FC3F7' }}>
                        {user.elo}
                    </td>
                    <td style={{ padding: '15px' }}>
                        <span className={`rank-${user.rank}`}>{user.rank}</span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;