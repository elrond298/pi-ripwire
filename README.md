# pi-ripwire

A [pi](https://pi.dev) extension that keeps the ripwire CLI in front of the agent so code navigation goes through ripwire instead of grep + whole-file reads.

## What it does

- **Session primer** — on `session_start`, queues a short primer telling the agent how to use ripwire (`--for`, `--callers`, `--impact`, `--from-trace`, `--situ`).
- **Prompt routing** — before each agent turn, non-command prompts of 10+ chars are checked with `ripwire --help-task=<prompt>`. When ripwire answers with a high-confidence recommendation, a one-line suggestion naming the right verb is injected into the turn.
- **Toggle** — `/ripwire [on|off]` enables/disables injection for the current session (no args toggles).

Routing failures (ripwire missing, timeout, low confidence) are silent no-ops.

## Requirements

- pi coding agent
- `ripwire` CLI on `PATH`

## Install

```bash
pi install git:github.com/elrond298/pi-ripwire
```

Or copy `ripwire.ts` into `~/.pi/agent/extensions/`.

## License

MIT
