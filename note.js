
// 永久備註（不會被批次清掉）
function loadGlobalNote() {
  return localStorage.getItem('global_note') || '';
}

function saveGlobalNote(val) {
  localStorage.setItem('global_note', val);
}

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('globalNote');
  const btn = document.getElementById('saveGlobalNote');

  if (textarea) textarea.value = loadGlobalNote();

  if (btn) {
    btn.addEventListener('click', () => {
      saveGlobalNote(textarea.value);
      alert('備註已儲存');
    });
  }
});
