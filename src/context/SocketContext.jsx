'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  lastEventTimestamp: null,
});

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const socketUrl = API_URL || 'http://localhost:5000';

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      window.dispatchEvent(new CustomEvent('socket_resync'));
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    // Track login state changes to update socket token
    const handleLoginChange = () => {
      const freshToken = localStorage.getItem('token');
      if (socketRef.current) {
        socketRef.current.auth = { token: freshToken };
        socketRef.current.disconnect().connect();
      }
    };

    window.addEventListener('loginStateChange', handleLoginChange);

    return () => {
      window.removeEventListener('loginStateChange', handleLoginChange);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, lastEventTimestamp }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
