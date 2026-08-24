'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Please wait...');
  const [navLoading, setNavLoading] = useState(false);

  const showLoading = useCallback((message = 'Please wait...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(async (asyncFn, message = 'Please wait...') => {
    showLoading(message);
    try {
      return await asyncFn();
    } finally {
      setTimeout(() => {
        hideLoading();
      }, 250);
    }
  }, [showLoading, hideLoading]);

  const startNavLoading = useCallback(() => {
    setNavLoading(true);
  }, []);

  const stopNavLoading = useCallback(() => {
    setNavLoading(false);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        navLoading,
        showLoading,
        hideLoading,
        withLoading,
        startNavLoading,
        stopNavLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
