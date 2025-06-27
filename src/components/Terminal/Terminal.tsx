import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Plus, X, Play, Square } from 'lucide-react';
import { Terminal as TerminalType } from '../../types';

interface TerminalProps {
  isVisible: boolean;
  isDarkTheme: boolean;
  onOutput?: (output: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ isVisible, isDarkTheme, onOutput }) => {
  const [terminals, setTerminals] = useState<TerminalType[]>([
    { id: '1', name: 'Terminal 1', isActive: true }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState('1');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRefs = useRef<Map<string, XTerm>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Expose method to write to terminal
  const writeToTerminal = (text: string, isError: boolean = false) => {
    const activeTerminal = terminalRefs.current.get(activeTerminalId);
    if (activeTerminal) {
      if (isError) {
        activeTerminal.write(`\x1b[31m${text}\x1b[0m`); // Red color for errors
      } else {
        activeTerminal.write(text);
      }
    }
  };

  // Expose this method to parent component
  React.useImperativeHandle(onOutput as any, () => ({
    writeToTerminal
  }));

  useEffect(() => {
    if (!isVisible) return;

    terminals.forEach(terminal => {
      if (!terminalRefs.current.has(terminal.id)) {
        const xterm = new XTerm({
          theme: {
            background: isDarkTheme ? '#1f2937' : '#ffffff',
            foreground: isDarkTheme ? '#f3f4f6' : '#1f2937',
            cursor: '#3b82f6',
            selection: isDarkTheme ? '#374151' : '#e5e7eb'
          },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          cursorBlink: true,
          scrollback: 1000,
          convertEol: true
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);

        terminalRefs.current.set(terminal.id, xterm);

        const container = containerRefs.current.get(terminal.id);
        if (container) {
          xterm.open(container);
          fitAddon.fit();

          // Welcome message
          xterm.writeln('\x1b[36m╭─────────────────────────────────────────╮\x1b[0m');
          xterm.writeln('\x1b[36m│       CodeBuddy.Ai Terminal             │\x1b[0m');
          xterm.writeln('\x1b[36m│   AI-Powered Code Execution Engine     │\x1b[0m');
          xterm.writeln('\x1b[36m╰─────────────────────────────────────────╯\x1b[0m');
          xterm.writeln('');
          xterm.writeln('\x1b[32m✨ Ready to execute your code!\x1b[0m');
          xterm.writeln('\x1b[33m💡 Use the AI Assistant to generate and run code\x1b[0m');
          xterm.writeln('');
          xterm.write('\x1b[34m$\x1b[0m ');

          let currentLine = '';

          // Handle input
          xterm.onData(data => {
            if (data === '\r') {
              xterm.writeln('');
              if (currentLine.trim()) {
                executeCommand(currentLine.trim(), xterm);
              }
              currentLine = '';
              xterm.write('\x1b[34m$\x1b[0m ');
            } else if (data === '\u007f') {
              // Backspace
              if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                xterm.write('\b \b');
              }
            } else if (data === '\u0003') {
              // Ctrl+C
              xterm.writeln('^C');
              currentLine = '';
              xterm.write('\x1b[34m$\x1b[0m ');
            } else {
              currentLine += data;
              xterm.write(data);
            }
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
          });
          resizeObserver.observe(container);
        }
      }
    });

    return () => {
      terminalRefs.current.forEach(terminal => {
        terminal.dispose();
      });
      terminalRefs.current.clear();
    };
  }, [isVisible, terminals, isDarkTheme]);

  const executeCommand = async (command: string, terminal: XTerm) => {
    setIsRunning(true);
    
    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (command === 'clear' || command === 'cls') {
        terminal.clear();
      } else if (command === 'help') {
        terminal.writeln('\x1b[33mAvailable commands:\x1b[0m');
        terminal.writeln('  help     - Show this help message');
        terminal.writeln('  clear    - Clear terminal');
        terminal.writeln('  ls       - List files');
        terminal.writeln('  pwd      - Show current directory');
        terminal.writeln('  echo     - Echo text');
        terminal.writeln('  date     - Show current date');
        terminal.writeln('');
        terminal.writeln('\x1b[32m💡 Use AI Assistant to generate and run code!\x1b[0m');
      } else if (command === 'ls') {
        terminal.writeln('src/');
        terminal.writeln('package.json');
        terminal.writeln('README.md');
        terminal.writeln('tsconfig.json');
        terminal.writeln('vite.config.ts');
      } else if (command === 'pwd') {
        terminal.writeln('/home/project');
      } else if (command.startsWith('echo ')) {
        terminal.writeln(command.substring(5));
      } else if (command === 'date') {
        terminal.writeln(new Date().toString());
      } else {
        terminal.writeln(`\x1b[31mCommand not found: ${command}\x1b[0m`);
        terminal.writeln('Type "help" for available commands');
      }
    } catch (error) {
      terminal.writeln(`\x1b[31mError: ${error}\x1b[0m`);
    } finally {
      setIsRunning(false);
    }
  };

  const addTerminal = () => {
    const newId = (terminals.length + 1).toString();
    const newTerminal: TerminalType = {
      id: newId,
      name: `Terminal ${newId}`,
      isActive: false
    };
    
    setTerminals(prev => prev.map(t => ({ ...t, isActive: false })).concat({ ...newTerminal, isActive: true }));
    setActiveTerminalId(newId);
  };

  const closeTerminal = (id: string) => {
    if (terminals.length === 1) return;

    const terminal = terminalRefs.current.get(id);
    if (terminal) {
      terminal.dispose();
      terminalRefs.current.delete(id);
    }

    setTerminals(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (id === activeTerminalId && filtered.length > 0) {
        setActiveTerminalId(filtered[0].id);
        return filtered.map((t, index) => ({ ...t, isActive: index === 0 }));
      }
      return filtered;
    });
  };

  const switchTerminal = (id: string) => {
    setActiveTerminalId(id);
    setTerminals(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
  };

  const clearTerminal = () => {
    const activeTerminal = terminalRefs.current.get(activeTerminalId);
    if (activeTerminal) {
      activeTerminal.clear();
      activeTerminal.write('\x1b[34m$\x1b[0m ');
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`h-64 border-t flex flex-col ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDarkTheme ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${
            isDarkTheme ? 'text-white' : 'text-gray-900'
          }`}>Terminal</span>
          <div className="flex">
            {terminals.map(terminal => (
              <div
                key={terminal.id}
                className={`flex items-center space-x-2 px-3 py-1 cursor-pointer rounded ${
                  terminal.isActive 
                    ? isDarkTheme 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-100 text-gray-900'
                    : isDarkTheme
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => switchTerminal(terminal.id)}
              >
                <span className="text-xs">{terminal.name}</span>
                {terminals.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTerminal(terminal.id);
                    }}
                    className={`rounded p-0.5 ${
                      isDarkTheme ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className={`p-1 rounded ${
              isDarkTheme 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Clear Terminal"
          >
            <Square size={14} />
          </button>
          <button
            onClick={addTerminal}
            className={`p-1 rounded ${
              isDarkTheme 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="New Terminal"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            ref={el => el && containerRefs.current.set(terminal.id, el)}
            className={`absolute inset-0 ${terminal.isActive ? 'block' : 'hidden'}`}
          />
        ))}
      </div>
    </div>
  );
};

// Export method to write to terminal
export const useTerminal = () => {
  const terminalRef = useRef<any>(null);
  
  const writeToTerminal = (text: string, isError: boolean = false) => {
    if (terminalRef.current?.writeToTerminal) {
      terminalRef.current.writeToTerminal(text, isError);
    }
  };
  
  return { terminalRef, writeToTerminal };
};