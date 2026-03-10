#!/usr/bin/env python3
"""Script de keepalive per Supabase via REST.

Objectiu:
- Fer dues crides GET lleugeres contra una taula publica.
- Verificar que el projecte respon i que les credencials estan operatives.

Exit codes:
- 0: OK
- 1: Falta alguna variable d'entorn requerida
- 2: Error de xarxa/HTTP durant el ping
"""

import os
import sys
import urllib.parse
import urllib.request


def require_env(name: str) -> str:
    """Retorna una variable d'entorn obligatoria o llança RuntimeError."""
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def build_url(base_url: str, table: str, query: str) -> str:
    """Construeix la URL REST de PostgREST per a una taula concreta."""
    base = base_url.rstrip("/")
    path = f"/rest/v1/{table}"
    return f"{base}{path}?{query}"


def ping(url: str, api_key: str) -> int:
    """Executa un GET autenticat i retorna l'HTTP status code."""
    req = urllib.request.Request(
        url,
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.getcode()


def main() -> int:
    """Punt d'entrada CLI del keepalive."""
    try:
        supabase_url = require_env("SUPABASE_URL")
        supabase_key = require_env("SUPABASE_ANON_KEY")
        ping_table = require_env("SUPABASE_PING_TABLE")
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    query = urllib.parse.urlencode({"select": "*", "limit": "1"})
    url = build_url(supabase_url, ping_table, query)

    try:
        # Doble ping per detectar errors intermitents basics.
        code_one = ping(url, supabase_key)
        code_two = ping(url, supabase_key)
    except Exception as exc:
        print(f"Ping failed: {exc}", file=sys.stderr)
        return 2

    print(f"Ping OK: {code_one}, {code_two}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
