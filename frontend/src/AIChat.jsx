import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, checkOllamaStatus, getModelInfo, pullModel } from './aiChatService';
import './AIChat.css';

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [modelInfo] = useState(getModelInfo());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkStatus = async () => {
    const status = await checkOllamaStatus();
    setOllamaStatus(status);
    
    if (status) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I'm your AI assistant powered by ${modelInfo.name}. How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const handlePullModel = async () => {
    setLoading(true);
    const success = await pullModel();
    if (success) {
      await checkStatus();
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await sendMessage(inputMessage, conversationHistory);
      
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message}. Please make sure Ollama is running with the ${modelInfo.name} model installed.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Chat cleared. How can I help you?`,
        timestamp: new Date()
      }
    ]);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (ollamaStatus === null) {
    return (
      <div className="ai-chat-container">
        <div className="ai-chat-loading">Checking AI service status...</div>
      </div>
    );
  }

  if (ollamaStatus === false) {
    return (
      <div className="ai-chat-container">
        <div className="ai-chat-error">
          <h3>⚠️ Ollama Not Available</h3>
          <p>The AI chat service requires Ollama to be running.</p>
          <div className="ai-chat-instructions">
            <h4>Setup Instructions:</h4>
            <ol>
              <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">ollama.ai</a></li>
              <li>Open a terminal and run: <code>ollama pull {modelInfo.name}</code></li>
              <li>Make sure Ollama is running on {modelInfo.url}</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <button onClick={checkStatus} className="retry-button">
            🔄 Check Again
          </button>
          <button onClick={handlePullModel} className="retry-button" disabled={loading}>
            {loading ? '⏳ Pulling Model...' : '📥 Try to Pull Model'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <h2>🤖 AI Assistant</h2>
          <div className="ai-chat-model-info">
            <span className="model-badge">{modelInfo.name}</span>
            <span className="status-indicator online">● Online</span>
          </div>
        </div>
        <button onClick={handleClearChat} className="clear-chat-button">
          🗑️ Clear Chat
        </button>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-header">
              <span className="message-role">
                {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
              </span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-header">
              <span className="message-role">🤖 AI Assistant</span>
            </div>
            <div className="message-content typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="ai-chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything about the CRM..."
          disabled={loading}
          className="ai-chat-input"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="ai-chat-send-button"
        >
          {loading ? '⏳' : '📤'} Send
        </button>
      </form>

      <div className="ai-chat-footer">
        <small>Powered by {modelInfo.name} via Ollama</small>
      </div>
    </div>
  );
}
