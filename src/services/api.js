import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token vào mỗi lần gọi API (nếu có)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Backend FastAPI dùng OAuth2, thường yêu cầu: "Bearer <token>"
    // Nhưng code backend hiện tại mình đang dùng token đơn giản, 
    // nếu sau này cậu nâng cấp bảo mật thì dùng dòng dưới:
    // config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;