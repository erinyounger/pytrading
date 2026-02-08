import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary 组件
 * 捕获React组件树中的JavaScript错误，记录错误并显示回退UI
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 调用自定义错误处理
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="mb-4 p-4 rounded-full bg-[var(--error)]/10">
            <AlertTriangle className="w-12 h-12 text-[var(--error)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            出现了一些问题
          </h2>
          <p className="text-[var(--text-secondary)] mb-4 max-w-md">
            抱歉，应用程序遇到了一个意外错误。请刷新页面或联系技术支持。
          </p>
          {this.state.error && (
            <details className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-lg text-left text-sm text-[var(--text-disabled)] max-w-2xl">
              <summary className="cursor-pointer mb-2">错误详情</summary>
              <pre className="whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-[var(--brand-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
