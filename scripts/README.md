# Scripts

Scripts auxiliars del projecte per operacions puntuals de manteniment.

## `supabase_keepalive.py`

Fa un ping REST a Supabase per validar que el projecte respon.

Variables d'entorn requerides:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_PING_TABLE`

Execucio:

```bash
python3 scripts/supabase_keepalive.py
```

Exit codes:
- `0`: ping correcte
- `1`: falta configuracio
- `2`: error de xarxa/HTTP
