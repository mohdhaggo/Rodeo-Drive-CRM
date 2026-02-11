@echo off
echo Starting Ollama with DeepSeek Coder...
echo.
echo Checking if Ollama is running...
ollama list

echo.
echo Starting DeepSeek Coder model...
ollama run deepseek-coder:latest

pause
