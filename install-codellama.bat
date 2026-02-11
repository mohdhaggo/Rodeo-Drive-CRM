@echo off
echo Installing CodeLlama 7B Instruct model...
echo This will download approximately 4GB
echo.
pause

ollama pull codellama:7b-instruct

echo.
echo CodeLlama installed successfully!
pause
