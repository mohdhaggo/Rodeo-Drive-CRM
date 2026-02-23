// AI Chat Service using Ollama with DeepSeek Coder model
// This service connects to local Ollama instance

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'deepseek-coder:6.7b';
const AI_TEMPERATURE = parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || 0.7;
const AI_MAX_TOKENS = parseInt(import.meta.env.VITE_AI_MAX_TOKENS) || 2000;

/**
 * Send a message to the AI model and get a response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<string>} - The AI's response
 */
export const sendMessage = async (message, conversationHistory = []) => {
  try {
    // Build the prompt with conversation history
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for Rodeo Drive CRM. You help users with questions about the CRM system, data analysis, and general support. Be concise and professional.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: AI_TEMPERATURE,
          num_predict: AI_MAX_TOKENS,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response from AI';
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw new Error(`Failed to communicate with AI: ${error.message}`);
  }
};

/**
 * Send a streaming message to the AI model
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @param {Function} onChunk - Callback for each chunk of the response
 * @returns {Promise<string>} - The complete AI response
 */
export const sendMessageStream = async (message, conversationHistory = [], onChunk) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for Rodeo Drive CRM. You help users with questions about the CRM system, data analysis, and general support. Be concise and professional.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        stream: true,
        options: {
          temperature: AI_TEMPERATURE,
          num_predict: AI_MAX_TOKENS,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            fullResponse += data.message.content;
            if (onChunk) {
              onChunk(data.message.content);
            }
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('AI Chat Stream Error:', error);
    throw new Error(`Failed to communicate with AI: ${error.message}`);
  }
};

/**
 * Check if Ollama is running and the model is available
 * @returns {Promise<boolean>} - True if Ollama is accessible
 */
export const checkOllamaStatus = async () => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const modelExists = data.models?.some(m => m.name === AI_MODEL);
    
    return modelExists;
  } catch (error) {
    console.error('Ollama status check failed:', error);
    return false;
  }
};

/**
 * Get information about the current AI model
 * @returns {Object} - Model configuration
 */
export const getModelInfo = () => {
  return {
    name: AI_MODEL,
    url: OLLAMA_URL,
    temperature: AI_TEMPERATURE,
    maxTokens: AI_MAX_TOKENS
  };
};

/**
 * Pull/download a model from Ollama library
 * @param {string} modelName - Name of the model to pull
 * @returns {Promise<boolean>} - True if successful
 */
export const pullModel = async (modelName = AI_MODEL) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: modelName
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Model pull failed:', error);
    return false;
  }
};
