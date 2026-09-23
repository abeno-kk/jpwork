(() => {
  'use strict';
  const channels = [
    [1, 'https://pwa.game123.asia'],
    [3, 'https://pwa.awin.today'],
    [4, 'https://pwa.xwin.asia'],
    [5, 'https://pwa.11win.asia'],
    [6, 'https://pwa.hccgame.online'],
    [7, 'https://pwa.yywin.online'],
    [8, 'https://pwa.haqgame.online'],
    [9, 'https://pwa.offsspack.info'],
    [10, 'https://weak.funsnowlucky.top'],
    [11, 'https://weak.elevenpackage.top'],
    [12, 'https://weak.twelvepacks.top'],
    [13, 'https://weak.seventypackage.cc'],
    [14, 'https://weak.artbyrichs.cc'],
    [15, 'https://weak.amlinear.com'],
  ];
  const get = (name) => document.getElementById(`url-builder-${name}`);
  const form = get('form'), channel = get('channel'), aid = get('aid');
  const token = get('token'), output = get('output'), copy = get('copy'), status = get('status');
  channels.forEach(([id, domain]) => channel.add(new Option(`渠道${id}_弱转PWA`, domain)));
  function update() {
    const aidValue = aid.value.trim(), tokenValue = token.value.trim();
    const validAid = /^[0-9]+$/.test(aidValue);
    const validToken = tokenValue.length > 0 && !/\s/.test(tokenValue);
    get('domain').textContent = channel.value;
    output.value = validAid && validToken
      ? `${channel.value}?aid=${encodeURIComponent(aidValue)}&login_token=${encodeURIComponent(tokenValue)}`
      : '';
    copy.disabled = !output.value;
    status.textContent = aidValue && !validAid ? 'AID 請填入純數字。'
      : tokenValue && !validToken ? 'TOKEN 中間不能包含空白或換行。' : '';
  }
  form.addEventListener('input', update);
  channel.addEventListener('change', update);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    update();
    if (!output.value) return;
    const value = output.value;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      status.textContent = '已複製網址。';
    } catch {
      output.focus();
      output.select();
      try {
        status.textContent = document.execCommand('copy') ? '已複製網址。' : '請按 Ctrl+C 複製已選取的網址。';
      } catch {
        status.textContent = '請按 Ctrl+C 複製已選取的網址。';
      }
    }
  });
  update();
})();