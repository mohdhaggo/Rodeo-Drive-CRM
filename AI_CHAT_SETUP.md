# AI Chat Assistant Setup Guide

## Overview

The Rodeo Drive CRM now includes an AI-powered chat assistant using **DeepSeek Coder 6.7B** model via Ollama. This provides intelligent assistance for CRM operations, data queries, and general support.

## Model Configuration

**Current Model:** `deepseek-coder:6.7b`

This model is configured in [frontend/.env](frontend/.env):

```env
VITE_OLLAMA_URL=http://localhost:11434
VITE_AI_MODEL=deepseek-coder:6.7b
VITE_AI_TEMPERATURE=0.7
VITE_AI_MAX_TOKENS=2000
```

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [https://ollama.ai](https://ollama.ai)

**Windows:**
```powershell
# Download from https://ollama.ai/download
# Run the installer
```

**macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Pull the DeepSeek Coder Model

After installing Ollama, pull the model:

```powershell
ollama pull deepseek-coder:6.7b
```

This will download approximately 4GB. Wait for the download to complete.

### 3. Verify Installation

Check that the model is available:

```powershell
ollama list
```

You should see `deepseek-coder:6.7b` in the list.

### 4. Start Ollama Service

Ollama should start automatically after installation. If not:

```powershell
ollama serve
```

This will start Ollama on `http://localhost:11434`

## Using the AI Assistant

1. **Launch the Application**
   ```powershell
   cd frontend
   npm run dev
   ```

2. **Access AI Assistant**
   - Log into the CRM
   - Click "AI Assistant" in the left sidebar
   - The assistant will check if Ollama is running and the model is available

3. **Chat Interface**
   - Type your question in the input field
   - Press "Send" or hit Enter
   - Wait for the AI response
   - Conversation history is maintained during your session

## Features

### ✅ Current Capabilities

- **Conversational AI**: Natural language interaction
- **Context Awareness**: Remembers conversation history
- **CRM Knowledge**: Trained on coding and technical assistance
- **Real-time Responses**: Streams responses as they're generated
- **Error Handling**: Clear error messages and setup guidance
- **Status Monitoring**: Shows if Ollama is running and model is available

### 🎨 UI Features

- Clean, modern interface with gradient header
- Message history with timestamps
- Typing indicators during response generation
- Auto-scroll to latest messages
- Clear chat functionality
- Responsive design for mobile/desktop

## Switching Models

You can switch to different Ollama models by updating the `.env` file:

### Other Popular Models

```env
# Smaller, faster model (1.8GB)
VITE_AI_MODEL=deepseek-coder:1.3b

# Larger, more capable model (25GB)
VITE_AI_MODEL=deepseek-coder:33b

# General purpose chat model
VITE_AI_MODEL=llama3:8b

# Coding specialist
VITE_AI_MODEL=codellama:7b

# Instruction-tuned model
VITE_AI_MODEL=mistral:7b
```

After changing the model:
1. Pull the new model: `ollama pull <model-name>`
2. Restart the frontend dev server
3. Refresh the browser

## Configuration Options

### Temperature (0.0 - 1.0)
Controls randomness in responses:
- `0.1-0.3`: More focused, deterministic
- `0.5-0.7`: Balanced (default)
- `0.8-1.0`: More creative, diverse

```env
VITE_AI_TEMPERATURE=0.7
```

### Max Tokens
Maximum length of AI responses:
- `500-1000`: Short, concise answers
- `2000`: Default, good balance
- `4000+`: Longer, detailed responses

```env
VITE_AI_MAX_TOKENS=2000
```

## Architecture

### Files Structure

```
frontend/src/
├── aiChatService.js    # API layer for Ollama communication
├── AIChat.jsx          # React component for chat UI
└── AIChat.css          # Styling for chat interface
```

### Service Functions

**aiChatService.js** provides:
- `sendMessage()` - Send a message and get response
- `sendMessageStream()` - Stream responses in real-time
- `checkOllamaStatus()` - Verify Ollama is running
- `getModelInfo()` - Get current model configuration
- `pullModel()` - Download a model if not available

## Troubleshooting

### "Ollama Not Available" Error

**Issue:** Cannot connect to Ollama service

**Solutions:**
1. Verify Ollama is installed: `ollama --version`
2. Start Ollama service: `ollama serve`
3. Check port 11434 is not blocked by firewall
4. Ensure no other service is using port 11434

### "Model Not Found" Error

**Issue:** DeepSeek model not downloaded

**Solution:**
```powershell
ollama pull deepseek-coder:6.7b
```

### Slow Responses

**Issue:** AI taking too long to respond

**Solutions:**
1. Use a smaller model (1.3b instead of 6.7b)
2. Reduce `VITE_AI_MAX_TOKENS` in .env
3. Check system resources (CPU/RAM usage)
4. Close other heavy applications

### Connection Refused

**Issue:** Cannot connect to `http://localhost:11434`

**Solutions:**
1. Restart Ollama: `ollama serve`
2. Check Ollama is running: `curl http://localhost:11434`
3. Verify CORS is not blocking requests
4. Check Windows Firewall settings

## Performance Tips

### For Better Speed

1. **Use GPU Acceleration**: Ollama automatically uses GPU if available
2. **Smaller Models**: Switch to `deepseek-coder:1.3b` for faster responses
3. **Lower Temperature**: Use 0.3 for more focused, faster responses
4. **Reduce Max Tokens**: Set to 1000 for shorter answers

### For Better Quality

1. **Larger Models**: Use `deepseek-coder:33b` if you have 32GB+ RAM
2. **Higher Temperature**: Use 0.8 for more creative responses
3. **More Context**: Provide detailed questions
4. **Conversation History**: The AI remembers previous messages

## API Integration

The chat service can be used programmatically:

```javascript
import { sendMessage } from './aiChatService';

const response = await sendMessage('How do I create a customer?');
console.log(response);
```

With conversation history:

```javascript
const history = [
  { role: 'user', content: 'What is a CRM?' },
  { role: 'assistant', content: 'CRM stands for Customer Relationship Management...' }
];

const response = await sendMessage('Tell me more', history);
```

## Security Considerations

- Ollama runs **locally** on your machine
- No data is sent to external servers
- All processing happens on your hardware
- Conversation history stored only in browser session
- No persistent storage of chat logs

## Future Enhancements

Potential improvements:
- [ ] Export chat conversations
- [ ] CRM-specific prompts and templates
- [ ] Integration with CRM data for contextual queries
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom model fine-tuning on CRM data

## Resources

- **Ollama Documentation**: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
- **DeepSeek**: [https://github.com/deepseek-ai/DeepSeek-Coder](https://github.com/deepseek-ai/DeepSeek-Coder)
- **Available Models**: [https://ollama.ai/library](https://ollama.ai/library)

## Support

For issues or questions:
1. Check Ollama is running: `ollama list`
2. Review browser console for errors (F12)
3. Check the [frontend/.env](frontend/.env) configuration
4. Verify model is downloaded: `ollama list`

---

**Current Status**: ✅ Configured with DeepSeek Coder 6.7B

To switch models, update `VITE_AI_MODEL` in [frontend/.env](frontend/.env) and restart the dev server.
