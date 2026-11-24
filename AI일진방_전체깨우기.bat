@echo off
chcp 65001 >nul
title 🏫 껌씹는 AI 일진방 — 모든 AI 전체 깨우기
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\wake_all_ai.ps1"
