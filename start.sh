#!/bin/bash
# Запуск Level Up на этом компьютере: http://localhost:8765
cd "$(dirname "$0")"
( sleep 1; xdg-open http://localhost:8765/ >/dev/null 2>&1 ) &
python3 -m http.server 8765
