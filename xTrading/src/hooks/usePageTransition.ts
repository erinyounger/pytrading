import { useState, useEffect } from 'react';

export const usePageTransition = (isVisible: boolean) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // 触发进入动画
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      setIsAnimating(false);
      // 等待动画结束后卸载组件
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // 匹配CSS动画时间

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return {
    shouldRender,
    isAnimating,
    className: isAnimating ? 'page-enter-active' : 'page-enter',
  };
};

export default usePageTransition;
