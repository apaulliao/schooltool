import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以便下一次 render 顯示 fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 你可以在這裡將錯誤發送到後端記錄服務 (如 Sentry)
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // 如果有傳入重置時的 callback (例如重抓資料)，在這裡執行
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // 1. 如果父層有提供自訂的 fallback UI，直接使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 2. 否則顯示預設的錯誤 UI
      return (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 min-h-[100px] w-full">
          <AlertTriangle className="mb-2 text-amber-500" size={24} />
          <p className="text-sm font-bold mb-2">此區塊暫時無法顯示</p>
          <button 
            onClick={this.handleReset}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw size={12} /> 重試
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;