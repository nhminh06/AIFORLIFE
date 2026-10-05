async function testAll() {
  const tests = [
    { name: 'Examples', cat: 'examples', msg: 'I have been studying English every day for the past three months, and I can already see a big improvement.' },
    { name: 'Quiz', cat: 'quiz', msg: 'I have been studying English every day for the past three months, and I can already see a big improvement.' },
    { name: 'Vocab Diff', cat: 'vocab_diff', msg: 'win vs beat' },
    { name: 'Error Correction', cat: 'error_correction', msg: "She don't like apple" },
    { name: 'Auto (12 thì)', cat: 'auto', msg: 'Tra cứu 12 thì' },
    { name: 'Auto (Thì HTHT tiếp diễn)', cat: 'auto', msg: 'Thì hiện tại hoàn thành tiếp diễn' }
  ];

  for (const t of tests) {
    const res = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: t.msg }], category: t.cat })
    });
    const d = await res.json();
    console.log(`[PASS] ${t.name} -> Model: ${d.model} (${d.executionTimeMs}ms)`);
  }
}
testAll();
