import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PRIMER = `ripwire CLI is available for code navigation — prefer it over grep + whole-file reads:
- Starting a task: ripwire . --for="<task>"  (ranked symbols, callers, quality flags)
- Who calls X / safe to change X: ripwire . --callers=X | --impact=X
- Error or stack trace in hand: ripwire . --from-trace=FILE
- Just edited code: ripwire . --situ  (blast radius + tests to run); targeted edit check: --edit-check=SYM
Run from the repo root. Zero results mean "not found", not "doesn't exist" (dynamic dispatch is a blind spot).`;

function decodeEntities(s: string): string {
	return s.replace(/&(apos|quot|lt|gt|amp);/g, (_, e: string) =>
		({ apos: "'", quot: '"', lt: "<", gt: ">", amp: "&" })[e] ?? e,
	);
}

export default function (pi: ExtensionAPI) {
	let enabled = true;

	pi.on("session_start", async (_event, ctx) => {
		if (!enabled) return;
		pi.sendMessage({ customType: "ripwire-primer", content: PRIMER, display: true }, { deliverAs: "nextTurn" });
		if (ctx.hasUI) ctx.ui.notify("ripwire: usage primer queued for this session", "info");
	});

	pi.on("before_agent_start", async (event, ctx) => {
		const prompt = (event.prompt ?? "").trim();
		if (!enabled) return undefined;
		let message: { customType: string; content: string; display: boolean } | undefined;


		if (prompt.length >= 10 && !prompt.startsWith("/") && ctx.cwd) {
			try {
				const r = await pi.exec("ripwire", [ctx.cwd, `--help-task=${prompt}`], { timeout: 10000 });
				const out = r.stdout ?? "";
				if (r.code === 0 && out.includes('status="recommend"') && out.includes('confidence="high"')) {
					const run = decodeEntities(out.match(/<run>([\s\S]*?)<\/run>/)?.[1] ?? "");
					if (run) {
						const reason = decodeEntities(out.match(/ reason="([^"]*)"/)?.[1] ?? "");
						const route = `ripwire suggests for this prompt: \`${run}\`${reason ? ` — ${reason}` : ""}. Use it instead of grep/whole-file reads when it fits; ignore if irrelevant.`;
						message = { customType: "ripwire-route", content: route, display: true };
					}
				}
			} catch {
				// ripwire missing/slow — silent no-op
			}
		}

		if (message && ctx.hasUI) ctx.ui.notify("ripwire: injected route suggestion", "info");
		return message ? { message } : undefined;
	});

	pi.registerCommand("ripwire", {
		description: "Toggle ripwire injection (on|off; no args = toggle; this session only)",
		handler: async (args, ctx) => {
			const arg = args.trim().toLowerCase();
			enabled = arg ? ["on", "1", "true"].includes(arg) : !enabled;
			ctx.ui.notify(`ripwire injection ${enabled ? "enabled" : "disabled"} (this session)`, "info");
		},
	});
}
