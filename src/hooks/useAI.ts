import { useState, useCallback } from 'react';
import { AIMessage, CodeExecutionResult } from '../types';

export const useAI = () => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const sendMessage = useCallback(async (content: string, code?: string) => {
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if OpenAI API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (apiKey) {
        // Use OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a helpful coding assistant. Provide clear, concise answers about programming. 
                When providing code examples, wrap them in \`\`\`language code blocks.
                You can help with:
                - Code explanation and debugging
                - Code generation from natural language
                - Code optimization and best practices
                - Programming concepts and tutorials
                
                Always format code properly and include the language identifier in code blocks.`
              },
              {
                role: 'user',
                content: code ? `${content}\n\nCode:\n\`\`\`\n${code}\n\`\`\`` : content
              }
            ],
            max_tokens: 1500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API request failed: ${response.status}`);
        }

        const data = await response.json();
        const aiContent = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        const aiResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiContent,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback to mock response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const aiResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateMockResponse(content, code),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('AI request failed:', error);
      
      const errorResponse: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. 

Please make sure your OpenAI API key is configured correctly in your environment variables (VITE_OPENAI_API_KEY).

You can still use me with mock responses for basic coding help!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runCode = useCallback(async (code: string, language: string): Promise<CodeExecutionResult> => {
    setIsRunning(true);
    
    try {
      // Simulate code execution with realistic delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await executeCode(code, language);
      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error'
      };
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isRunning,
    sendMessage,
    runCode,
    clearChat
  };
};

const executeCode = async (code: string, language: string): Promise<CodeExecutionResult> => {
  // Simulate different execution scenarios based on language and code content
  const lowerLang = language.toLowerCase();
  
  try {
    if (lowerLang === 'python' || lowerLang === 'py') {
      return executePython(code);
    } else if (lowerLang === 'javascript' || lowerLang === 'js') {
      return executeJavaScript(code);
    } else if (lowerLang === 'java') {
      return executeJava(code);
    } else if (lowerLang === 'cpp' || lowerLang === 'c++') {
      return executeCpp(code);
    } else if (lowerLang === 'c') {
      return executeC(code);
    } else {
      return {
        success: true,
        output: `Code executed successfully!\nLanguage: ${language}\nNote: This is a simulated execution environment.`,
        error: ''
      };
    }
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Execution failed'
    };
  }
};

const executePython = (code: string): CodeExecutionResult => {
  // Simulate Python execution
  if (code.includes('print(')) {
    const printMatches = code.match(/print\((.*?)\)/g);
    if (printMatches) {
      const outputs = printMatches.map(match => {
        const content = match.replace(/print\(|\)/g, '').replace(/['"]/g, '');
        return content;
      });
      return {
        success: true,
        output: outputs.join('\n'),
        error: ''
      };
    }
  }
  
  if (code.includes('def ')) {
    return {
      success: true,
      output: 'Function defined successfully.\nPython 3.9.0 (simulated)',
      error: ''
    };
  }
  
  if (code.includes('import ')) {
    return {
      success: true,
      output: 'Modules imported successfully.',
      error: ''
    };
  }
  
  // Simulate syntax error
  if (code.includes('syntax_error')) {
    return {
      success: false,
      output: '',
      error: 'SyntaxError: invalid syntax\n  File "<stdin>", line 1\n    syntax_error\n               ^\nSyntaxError: invalid syntax'
    };
  }
  
  return {
    success: true,
    output: 'Python code executed successfully.\nPython 3.9.0 (simulated)',
    error: ''
  };
};

const executeJavaScript = (code: string): CodeExecutionResult => {
  try {
    // Simple JavaScript execution simulation
    if (code.includes('console.log(')) {
      const logMatches = code.match(/console\.log\((.*?)\)/g);
      if (logMatches) {
        const outputs = logMatches.map(match => {
          const content = match.replace(/console\.log\(|\)/g, '').replace(/['"]/g, '');
          return content;
        });
        return {
          success: true,
          output: outputs.join('\n'),
          error: ''
        };
      }
    }
    
    if (code.includes('function ')) {
      return {
        success: true,
        output: 'Function defined successfully.\nNode.js v18.0.0 (simulated)',
        error: ''
      };
    }
    
    // Try to evaluate simple expressions
    if (/^\s*\d+\s*[\+\-\*\/]\s*\d+\s*$/.test(code.trim())) {
      try {
        const result = eval(code);
        return {
          success: true,
          output: result.toString(),
          error: ''
        };
      } catch {
        // Fall through to default
      }
    }
    
    return {
      success: true,
      output: 'JavaScript code executed successfully.\nNode.js v18.0.0 (simulated)',
      error: ''
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: `ReferenceError: ${error}\n    at <anonymous>:1:1`
    };
  }
};

const executeJava = (code: string): CodeExecutionResult => {
  if (code.includes('System.out.println(')) {
    const printMatches = code.match(/System\.out\.println\((.*?)\)/g);
    if (printMatches) {
      const outputs = printMatches.map(match => {
        const content = match.replace(/System\.out\.println\(|\)/g, '').replace(/['"]/g, '');
        return content;
      });
      return {
        success: true,
        output: outputs.join('\n'),
        error: ''
      };
    }
  }
  
  if (code.includes('public class ')) {
    return {
      success: true,
      output: 'Compilation successful.\nJava 11.0.0 (simulated)',
      error: ''
    };
  }
  
  // Simulate compilation error
  if (code.includes('compile_error')) {
    return {
      success: false,
      output: '',
      error: 'Main.java:1: error: cannot find symbol\n  compile_error\n  ^\n  symbol: variable compile_error\n1 error'
    };
  }
  
  return {
    success: true,
    output: 'Java code compiled and executed successfully.\nJava 11.0.0 (simulated)',
    error: ''
  };
};

const executeCpp = (code: string): CodeExecutionResult => {
  if (code.includes('cout')) {
    const coutMatches = code.match(/cout\s*<<\s*(.*?)\s*;/g);
    if (coutMatches) {
      const outputs = coutMatches.map(match => {
        const content = match.replace(/cout\s*<<\s*|;/g, '').replace(/['"]/g, '');
        return content;
      });
      return {
        success: true,
        output: outputs.join('\n'),
        error: ''
      };
    }
  }
  
  if (code.includes('#include')) {
    return {
      success: true,
      output: 'Compilation successful.\ng++ (GCC) 9.3.0 (simulated)',
      error: ''
    };
  }
  
  return {
    success: true,
    output: 'C++ code compiled and executed successfully.\ng++ (GCC) 9.3.0 (simulated)',
    error: ''
  };
};

const executeC = (code: string): CodeExecutionResult => {
  if (code.includes('printf(')) {
    const printfMatches = code.match(/printf\((.*?)\)/g);
    if (printfMatches) {
      const outputs = printfMatches.map(match => {
        const content = match.replace(/printf\(|\)/g, '').replace(/['"]/g, '');
        return content;
      });
      return {
        success: true,
        output: outputs.join('\n'),
        error: ''
      };
    }
  }
  
  if (code.includes('#include')) {
    return {
      success: true,
      output: 'Compilation successful.\ngcc (GCC) 9.3.0 (simulated)',
      error: ''
    };
  }
  
  return {
    success: true,
    output: 'C code compiled and executed successfully.\ngcc (GCC) 9.3.0 (simulated)',
    error: ''
  };
};

const generateMockResponse = (userMessage: string, code?: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello world') || lowerMessage.includes('print hello')) {
    return `Here's a simple "Hello World" program in multiple languages:

**Python:**
\`\`\`python
print("Hello, World!")
\`\`\`

**JavaScript:**
\`\`\`javascript
console.log("Hello, World!");
\`\`\`

**Java:**
\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

Click the "Run" button to execute any of these code snippets!`;
  }
  
  if (lowerMessage.includes('bug') || lowerMessage.includes('fix')) {
    return `I can help you debug your code! ${code ? 'Looking at your code, here are some potential issues to check:\n\n1. **Variable declarations** - Make sure all variables are properly declared\n2. **Syntax errors** - Check for missing semicolons, brackets, or quotes\n3. **Logic flow** - Verify your conditional statements and loops\n4. **Edge cases** - Consider what happens with empty inputs or boundary values\n\nWould you like me to analyze a specific part?' : 'Please share your code and I\'ll help identify any issues.'}`;
  }
  
  if (lowerMessage.includes('explain')) {
    return code 
      ? `Here's what your code does:\n\n\`\`\`${getLanguageFromCode(code)}\n${code}\n\`\`\`\n\nThis code appears to be working with ${code.includes('function') ? 'functions' : code.includes('class') ? 'classes' : 'basic operations'}. The main functionality involves:\n\n1. ${code.split('\n')[0] || 'Initial setup'}\n2. Processing and logic implementation\n3. Output or return statements\n\nWould you like me to explain any specific part in more detail?`
      : 'I\'d be happy to explain code for you! Please share the code you\'d like me to analyze.';
  }
  
  if (lowerMessage.includes('comment')) {
    return code 
      ? `Here's your code with helpful comments:\n\n\`\`\`${getLanguageFromCode(code)}\n${addCommentsToCode(code)}\n\`\`\``
      : 'I can add comments to your code! Please share the code you\'d like me to comment.';
  }
  
  if (lowerMessage.includes('optimize')) {
    return `Here are some optimization suggestions:\n\n1. **Performance**: Consider using more efficient algorithms (O(n) vs O(n²))\n2. **Memory**: Reduce unnecessary variable declarations and object creation\n3. **Readability**: Use descriptive variable names and consistent formatting\n4. **Best Practices**: Follow language-specific conventions and patterns\n\n${code ? 'Based on your code, I can provide more specific recommendations. Would you like me to refactor it?' : 'Share your code for personalized optimization tips!'}`;
  }

  if (lowerMessage.includes('sort') || lowerMessage.includes('algorithm')) {
    return `Here are some common sorting algorithms:

**Bubble Sort (Simple but slow):**
\`\`\`python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr
\`\`\`

**Quick Sort (Fast and efficient):**
\`\`\`python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
\`\`\`

Try running these to see how they work!`;
  }

  // Default responses
  const responses = [
    `I can help you with that! ${lowerMessage.includes('how') ? 'Here\'s a step-by-step approach:' : 'Let me break this down for you:'}`,
    `Great question! For ${userMessage}, I'd recommend considering the following approaches...`,
    `I see you're working on something interesting. ${code ? 'Your code looks good, but here are some suggestions you could consider.' : 'Let me help you solve this problem.'}`,
    `Here's what I think about your question: ${userMessage}. ${code ? 'Looking at your code, I can suggest some improvements.' : 'Would you like me to provide a code example?'}`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

const getLanguageFromCode = (code: string): string => {
  if (code.includes('def ') || code.includes('print(')) return 'python';
  if (code.includes('console.log') || code.includes('function ')) return 'javascript';
  if (code.includes('public class') || code.includes('System.out')) return 'java';
  if (code.includes('#include') && code.includes('cout')) return 'cpp';
  if (code.includes('#include') && code.includes('printf')) return 'c';
  return 'plaintext';
};

const addCommentsToCode = (code: string): string => {
  const lines = code.split('\n');
  return lines.map(line => {
    if (line.trim() === '') return line;
    if (line.includes('function') || line.includes('def ')) {
      return `${line}\n// Function definition`;
    }
    if (line.includes('return')) {
      return `${line}\n// Return statement`;
    }
    if (line.includes('if') || line.includes('for') || line.includes('while')) {
      return `${line}\n// Control flow statement`;
    }
    return line;
  }).join('\n');
};