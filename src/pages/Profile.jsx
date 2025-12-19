import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [passData, setPassData] = useState({ old: '', new: '' });
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) navigate('/login');
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${username}`);
        setProfile(res.data);
      } catch (error) { console.error(error); }
    };
    fetchProfile();
  }, []);

  const handleChangePass = async (e) => {
      e.preventDefault();
      try {
          await api.post('/users/change_password', {
              username: username,
              old_password: passData.old,
              new_password: passData.new
          });
          alert("Đổi mật khẩu thành công!");
          setPassData({ old: '', new: '' });
      } catch (error) {
          alert(error.response?.data?.detail || "Lỗi đổi mật khẩu");
      }
  };

  if (!profile) return <div style={{textAlign: 'center', marginTop: '50px', color: 'white'}}>Đang tải hồ sơ...</div>;

  return (
    <div style={{ padding: '40px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px', alignSelf: 'flex-start', background: 'white', color: '#333' }}>⬅ Về Sảnh</button>
      
      {/* THẺ HỒ SƠ - Nền trắng -> Chữ phải đen (#333) */}
      <div style={{ 
        width: '100%', maxWidth: '500px', background: 'white', 
        padding: '40px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        color: '#333' // KHẮC PHỤC LỖI CHỮ TRẮNG
      }}>
        
        {/* Avatar & Info */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ 
                width: '100px', height: '100px', background: '#eee', borderRadius: '50%', 
                margin: '0 auto 15px', lineHeight: '100px', fontSize: '50px' 
            }}>
              👤
            </div>
            <h2 style={{margin: '0 0 5px 0', fontSize: '2rem'}}>{profile.username}</h2>
            <p style={{color: '#666', margin: 0}}>{profile.email || "Chưa cập nhật email"}</p>
        </div>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#2196F3', fontSize: '1.8rem' }}>{profile.elo}</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Elo Point</p>
          </div>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#FF9800', fontSize: '1.8rem' }}>{profile.rank}</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Rank</p>
          </div>
          <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#4CAF50', fontSize: '1.5rem' }}>{profile.wins}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Thắng</p>
          </div>
          <div style={{ background: '#ffebee', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#F44336', fontSize: '1.5rem' }}>{profile.losses}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Thua</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

        {/* Đổi Mật Khẩu */}
        <h3 style={{ marginBottom: '20px' }}>🔐 Đổi Mật Khẩu</h3>
        <form onSubmit={handleChangePass} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
                type="password" placeholder="Mật khẩu cũ" required
                value={passData.old} onChange={(e) => setPassData({...passData, old: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
            />
            <input 
                type="password" placeholder="Mật khẩu mới" required
                value={passData.new} onChange={(e) => setPassData({...passData, new: e.target.value})}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }}
            />
            <button type="submit" style={{ background: '#333', color: 'white', padding: '12px' }}>Xác Nhận Đổi</button>
        </form>

      </div>
    </div>
  );
};

export default Profile;