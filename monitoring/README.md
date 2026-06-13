# Monitoring

This starts Uptime Kuma and Beszel Hub for the local app.

## URLs

- App frontend: http://localhost:3000
- App backend health: http://localhost:3010/api/health
- Uptime Kuma: http://localhost:3001
- Beszel Hub: http://localhost:8090

## Start

```powershell
cd C:\Users\Degry121\Desktop\diplom-zxc-1.0\monitoring
docker compose up -d uptime-kuma beszel
```

## Uptime Kuma monitor

Create an HTTP(s) monitor with this URL:

```text
http://host.docker.internal:3010/api/health
```

Use `host.docker.internal` because Uptime Kuma runs inside Docker and needs to reach the Windows host.

## Beszel agent

1. Open http://localhost:8090 and create the admin account.
2. Add a local system in Beszel and copy the generated `TOKEN` and `KEY`.
3. Copy `.env.example` to `.env`, paste the token and key.
4. Start the agent:

```powershell
docker compose --profile agent up -d
```

When adding the local system, use this Host / IP:

```text
/beszel_socket/beszel.sock
```
