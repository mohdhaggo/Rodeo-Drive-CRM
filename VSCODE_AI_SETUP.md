# VS Code AI Integration with Local Ollama

## Configuration Complete ✅

Your VS Code is now configured to use **local Ollama with deepseek-coder** model for AI-powered coding assistance.

## Recommended Extensions

The following extensions are configured in [.vscode/extensions.json](.vscode/extensions.json):

1. **Twinny** (`rjmacarthy.twinny`) - Best overall local AI integration
   - Real-time code completion
   - AI chat sidebar
   - Fill-in-the-middle code generation

2. **VSCode Ollama** (`warm3snow.vscode-ollama`) - Simple Ollama chat
   - Command palette AI chat
   - Code explanation and refactoring

3. **Ollama Autocoder** (`10nates.ollama-autocoder`) - Focused on autocomplete
   - Ghost text suggestions
   - Fast inline completions

4. **Cody AI** (`sourcegraph.cody-ai`) (Optional) - Full-featured AI assistant
   - Context-aware code suggestions
   - Chat with codebase understanding

## Installation

VS Code should prompt you to install recommended extensions. Or install manually:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: `Extensions: Show Recommended Extensions`
3. Install desired extensions

Or install via command line:
```powershell
code --install-extension rjmacarthy.twinny
code --install-extension warm3snow.vscode-ollama
code --install-extension 10nates.ollama-autocoder
```

## Configuration

All extensions are pre-configured in [.vscode/settings.json](.vscode/settings.json) to use:

- **Ollama URL**: `http://localhost:11434`
- **Model**: `deepseek-coder:latest`
- **Temperature**: `0.7`
- **Max Tokens**: `2000`

## Usage

### Twinny (Recommended)
- **Chat**: Click Twinny icon in sidebar or `Ctrl+Shift+T`
- **Autocomplete**: Start typing, AI suggestions appear automatically
- **Accept**: `Tab` or `Enter`
- **Reject**: `Esc` or continue typing

### VSCode Ollama
- **Chat**: `Ctrl+Shift+P` → "Ollama: Ask"
- **Explain Code**: Select code → `Ctrl+Shift+P` → "Ollama: Explain"
- **Generate**: `Ctrl+Shift+P` → "Ollama: Generate"

### Ollama Autocoder
- **Autocomplete**: Automatic as you type
- **Preview**: Shows completion preview in gray text
- **Accept**: `Tab`

## Verify Ollama is Running

Before using extensions, ensure Ollama is running:

```powershell
# Check Ollama service
ollama list

# Test API
Invoke-WebRequest -Uri http://localhost:11434/api/tags -UseBasicParsing
```

## Keyboard Shortcuts

Add to your user keybindings for quick access:

```json
{
  "key": "ctrl+shift+/",
  "command": "twinny.chat"
},
{
  "key": "ctrl+alt+/",
  "command": "vscode-ollama.ask"
}
```

## Troubleshooting

### Extensions not working
1. Verify Ollama is running: `ollama list`
2. Check model is available: Should see `deepseek-coder:latest`
3. Test Ollama API: `curl http://localhost:11434/api/tags`
4. Restart VS Code after installing extensions

### Slow responses
- Adjust temperature/tokens in [.vscode/settings.json](.vscode/settings.json)
- Use smaller model if needed: `ollama pull deepseek-coder:1.3b`

### No suggestions appearing
- Enable inline suggestions: Settings → Editor: Inline Suggest
- Check extension status in bottom bar
- Review extension logs in Output panel

## Alternative Models

To use a different model, update these settings in [.vscode/settings.json](.vscode/settings.json):

```json
{
  "twinny.chatModelName": "codellama:7b",
  "vscode-ollama.model": "codellama:7b",
  "ollama-autocoder.model": "codellama:7b"
}
```

Available coding models:
- `deepseek-coder:latest` (Current - 776MB)
- `codellama:7b` (7GB)
- `qwen2.5-coder:7b` (4.7GB)
- `starcoder2:3b` (1.7GB)

## Resources

- [Ollama Models](https://ollama.ai/library)
- [Twinny Documentation](https://github.com/rjmacarthy/twinny)
- [VSCode Ollama](https://github.com/huanguolin/vscode-ollama)
- [Ollama Autocoder](https://github.com/10Nates/ollama-autocoder)

## Notes

- All AI processing happens **locally** on your machine
- No code is sent to external services
- Works offline once model is downloaded
- Privacy-focused development workflow
