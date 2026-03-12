import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import ChatWindow from '../components/Chatbot/ChatWindow';
import ChatInput from '../components/Chatbot/ChatInput';
import ReasoningPanel from '../components/Chatbot/ReasoningPanel';
import ResponseCard from '../components/Chatbot/ResponseCard';
import ModeToggle from '../components/Chatbot/ModeToggle';

import API_BASE_URL from '../api/config';

const IntelAgent = () => {
  const [mode, setMode] = useState('Real World'); // 'Real World' or 'Hypothetical'
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  // Clear chat when switching modes
  useEffect(() => {
    setMessages([]);
    setIsThinking(false);
    setReasoningSteps([]);
    setCurrentStepIndex(-1);
    setError(null);
  }, [mode]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, currentStepIndex]);

  const handleSendMessage = async (query) => {
    if (!query.trim()) return;

    // Add user message to history
    const userMessage = { role: 'user', content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    // Reset state for new query
    setIsThinking(true);
    setReasoningSteps([]);
    setCurrentStepIndex(-1);
    setError(null);

    const steps = [
      "Connecting to Reality agentic nodes...",
      "Identifying geopolitical entities in query...",
      "Determining affected global systems...",
      "Gathering indicators from relevant data sources...",
      "Generating strategic intelligence report via Gemini..."
    ];

    setReasoningSteps(steps);

    // Simulate sequential reasoning steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStepIndex(i);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/intel/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, mode })
      });

      const responseData = await response.json().catch(() => ({})); // Attempt to parse JSON, even if response is not OK

      if (!response.ok) {
        throw new Error(responseData.message || `Server Error: ${response.status}`);
      }

      const botMessage = {
        role: 'assistant',
        content: responseData,
        timestamp: new Date(),
        isIntelReport: true
      };

      setCurrentStepIndex(steps.length);
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Intel Agent Error:", err);
      setError(err.message || "The intelligence nodes are currently unreachable. Please check your Gemini API key.");
    } finally {
      setIsThinking(false);
      scrollToBottom();
    }
  };

  return (
    <div className="intel-agent-page">
      <div className="intel-agent-container full-width">
        <header className="intel-header">
          <div className="intel-header-title">
            <h1>Reality Intelligence Agent</h1>
            <p className="status-indicator"><span className="online"></span> Online • Powered by Groq Llama 3</p>
          </div>
          <ModeToggle mode={mode} setMode={setMode} disabled={isThinking} />
        </header>

        <div className="intel-content-layout full-width">
          <div className="chat-main-area">
            <ChatWindow
              messages={messages}
              isThinking={isThinking}
              chatEndRef={chatEndRef}
              reasoningPanel={isThinking ? <ReasoningPanel steps={reasoningSteps} currentIndex={currentStepIndex} /> : null}
            />
            {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <ChatInput onSend={handleSendMessage} disabled={isThinking} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelAgent;
