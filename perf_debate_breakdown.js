const fetch = global.fetch;

(async () => {
  const url = 'https://invest-giant-battle.onrender.com/api/debate';
  const start = Date.now();
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker: 'AAPL' }),
  });

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let counts = { stock_data: 0, generating: 0, progress: 0, master_opinion: 0, done: 0, error: 0 };
  let marks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        counts[e.type] = (counts[e.type] || 0) + 1;
        if (['stock_data','master_opinion','done','error','progress'].includes(e.type)) {
          marks.push({ t: Date.now()-start, type: e.type, generated: e.generated, total: e.total });
        }
      } catch {}
    }
  }

  const masters = marks.filter(m => m.type === 'master_opinion').map(m => m.t);
  const firstMaster = masters[0] ?? null;
  const lastMaster = masters[masters.length-1] ?? null;
  const doneMark = marks.find(m => m.type === 'done')?.t ?? null;

  console.log(JSON.stringify({
    status: resp.status,
    counts,
    firstMasterMs: firstMaster,
    lastMasterMs: lastMaster,
    doneMs: doneMark,
    sampleMarks: marks.slice(0, 8),
    tailMarks: marks.slice(-8)
  }, null, 2));
})();
