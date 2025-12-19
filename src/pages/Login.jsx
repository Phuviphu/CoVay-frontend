import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Gọi API đăng nhập
      const response = await api.post('/auth/login', {
        username: username,
        password: password
      });

      // 2. Lưu Token và thông tin user vào bộ nhớ trình duyệt
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('elo', response.data.elo);

      alert("Đăng nhập thành công!");
      
      // 3. Chuyển hướng về Sảnh chính
      navigate('/'); 
    } catch (err) {
      setError(err.response?.data?.detail || "Đăng nhập thất bại");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h2 style={{ textAlign: 'center' }}>Đăng Nhập</h2>
        
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="text" 
            placeholder="Tên đăng nhập" 
            required 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          
          <button type="submit" style={styles.button}>Vào Game</button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

// CSS viết trực tiếp cho gọn
const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' },
  formBox: { width: '350px', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px', fontSize: '16px' },
  button: { padding: '10px', fontSize: '16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }
};

export default Login;