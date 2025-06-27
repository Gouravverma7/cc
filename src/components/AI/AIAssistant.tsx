import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Copy, Code, Bug, FileText, HelpCircle, Play, Loader, Terminal as TerminalIcon, Download } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { AIMessage } from '../../types';

interface AIAssistantProps {
  currentCode?: string;
  onCodeInsert?: (code: string) => void;
  onTerminalOutput?: (output: string, isError?: boolean) => void;
  isDarkTheme: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentCode,
  onCodeInsert,
  onTerminalOutput,
  isDarkTheme
}) => {
  const { messages, isLoading, sendMessage, clearChat, runCode, isRunning } = useAI();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim(), currentCode);
      setInput('');
    }
  };

  const quickActions = [
    {
      icon: Bug,
      label: 'Fix Bugs',
      prompt: 'Please analyze this code and help me fix any bugs or issues:'
    },
    {
      icon: Code,
      label: 'Explain Code',
      prompt: 'Please explain what this code does:'
    },
    {
      icon: FileText,
      label: 'Add Comments',
      prompt: 'Please add helpful comments to this code:'
    },
    {
      icon: HelpCircle,
      label: 'Optimize',
      prompt: 'Please suggest optimizations for this code:'
    }
  ];

  const handleQuickAction = (prompt: string) => {
    if (currentCode) {
      sendMessage(prompt, currentCode);
    } else {
      setInput(prompt);
    }
  };

  const handleRunCode = async (code: string, language: string) => {
    if (onTerminalOutput) {
      onTerminalOutput(`\n🚀 Running ${language} code...\n`, false);
    }
    
    const result = await runCode(code, language);
    
    if (onTerminalOutput) {
      if (result.success) {
        onTerminalOutput(`✅ Execution completed:\n${result.output}\n`, false);
      } else {
        onTerminalOutput(`❌ Execution failed:\n${result.error}\n`, true);
      }
    }
  };

  return (
    <div className={`w-80 border-l flex flex-col h-full ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`p-4 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            AI Assistant
          </h2>
          <button
            onClick={clearChat}
            className={`p-1 rounded ${
              isDarkTheme 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.prompt)}
              className={`p-2 rounded text-xs transition-colors flex items-center space-x-1 ${
                isDarkTheme 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
              }`}
            >
              <action.icon size={12} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className={`text-sm text-center py-8 ${
            isDarkTheme ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <div className="mb-4">
              <Code size={32} className={`mx-auto ${
                isDarkTheme ? 'text-gray-600' : 'text-gray-400'
              }`} />
            </div>
            <p>Hi! I'm your AI coding assistant.</p>
            <p className="mt-2">Ask me to explain code, fix bugs, generate code, or help with programming questions!</p>
            <p className="mt-2 text-xs">I can also run your code and show results in the terminal.</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={() => navigator.clipboard.writeText(message.content)}
              onInsert={onCodeInsert}
              onRun={handleRunCode}
              isRunning={isRunning}
              isDarkTheme={isDarkTheme}
            />
          ))
        )}
        
        {isLoading && (
          <div className={`flex items-center space-x-2 ${
            isDarkTheme ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full"></div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={`p-4 border-t ${
        isDarkTheme ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className={`flex-1 px-3 py-2 rounded border focus:outline-none ${
              isDarkTheme 
                ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500'
                : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

interface MessageBubbleProps {
  message: AIMessage;
  onCopy: () => void;
  onInsert?: (code: string) => void;
  onRun?: (code: string, language: string) => void;
  isRunning: boolean;
  isDarkTheme: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onCopy, 
  onInsert, 
  onRun, 
  isRunning, 
  isDarkTheme 
}) => {
  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }
    
    return blocks;
  };

  const codeBlocks = message.type === 'assistant' ? extractCodeBlocks(message.content) : [];

  const formatMessageContent = (content: string) => {
    // Replace code blocks with placeholders for rendering
    let formattedContent = content;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    formattedContent = formattedContent.replace(codeBlockRegex, (match, lang, code) => {
      return `\n[CODE BLOCK: ${lang || 'code'}]\n`;
    });
    
    return formattedContent;
  };

  return (
    <div className={`${message.type === 'user' ? 'ml-8' : 'mr-8'}`}>
      <div
        className={`p-3 rounded-lg ${
          message.type === 'user'
            ? 'bg-blue-600 text-white ml-auto'
            : isDarkTheme
              ? 'bg-gray-700 text-gray-200'
              : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm">{formatMessageContent(message.content)}</div>
        
        {message.type === 'assistant' && codeBlocks.length > 0 && (
          <div className="mt-3 space-y-3">
            {codeBlocks.map((block, index) => (
              <div key={index} className={`border rounded-lg overflow-hidden ${
                isDarkTheme ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <div className={`px-3 py-2 text-xs font-mono flex items-center justify-between ${
                  isDarkTheme ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  <span>{block.language}</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => navigator.clipboard.writeText(block.code)}
                      className={`p-1 rounded transition-colors ${
                        isDarkTheme
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Copy code"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => onInsert?.(block.code)}
                      className={`p-1 rounded transition-colors ${
                        isDarkTheme
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                      title="Insert into editor"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
                <pre className={`p-3 text-xs font-mono overflow-x-auto ${
                  isDarkTheme ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'
                }`}>
                  <code>{block.code}</code>
                </pre>
                <div className={`px-3 py-2 border-t flex space-x-2 ${
                  isDarkTheme ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
                }`}>
                  <button
                    onClick={() => onInsert?.(block.code)}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                      isDarkTheme
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title="Insert code into editor"
                  >
                    <Download size={10} />
                    <span>Insert</span>
                  </button>
                  <button
                    onClick={() => onRun?.(block.code, block.language)}
                    disabled={isRunning}
                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                      isDarkTheme
                        ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600'
                        : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
                    }`}
                    title="Run code in terminal"
                  >
                    {isRunning ? <Loader size={10} className="animate-spin" /> : <Play size={10} />}
                    <span>Run</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {message.type === 'assistant' && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onCopy}
              className={`p-1 rounded transition-colors ${
                isDarkTheme
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
              title="Copy response"
            >
              <Copy size={12} />
            </button>
          </div>
        )}
      </div>
      <div className={`text-xs mt-1 ${
        isDarkTheme ? 'text-gray-500' : 'text-gray-600'
      }`}>
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};