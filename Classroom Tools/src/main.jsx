import React from 'react'
import ReactDOM from 'react-dom/client'
// 這裡引入您原本寫好的主程式，請確保檔名一致
import App from './ClassroomDashboardV2'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)