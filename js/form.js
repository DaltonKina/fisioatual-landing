// ========== LEAD FORM ==========
const form = document.querySelector('#lead-form');
if (!form) { /* nothing */ } else {

  const submitBtn = form.querySelector('[type="submit"]');
  const statusEl = document.querySelector('#form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    const required = form.querySelectorAll('[required]');
    let valid = true;

    required.forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#F87171';
        valid = false;
      }
    });

    // Email validation
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailField.value)) {
        emailField.style.borderColor = '#F87171';
        valid = false;
      }
    }

    if (!valid) {
      showStatus('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
      const data = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        showStatus('✅ Mensagem enviada! Entraremos em contato em breve.', 'success');
        form.reset();
      } else {
        throw new Error('Server error');
      }
    } catch {
      showStatus('❌ Ocorreu um erro. Por favor, envie um e-mail para daltonkina@gmail.com.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
    }
  });

  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.display = 'block';
    statusEl.style.padding = '1rem 1.25rem';
    statusEl.style.borderRadius = '10px';
    statusEl.style.fontSize = '0.9rem';
    statusEl.style.marginTop = '1rem';

    if (type === 'success') {
      statusEl.style.background = 'rgba(34, 197, 94, 0.12)';
      statusEl.style.border = '1px solid rgba(34, 197, 94, 0.3)';
      statusEl.style.color = '#4ADE80';
    } else {
      statusEl.style.background = 'rgba(239, 68, 68, 0.12)';
      statusEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      statusEl.style.color = '#F87171';
    }

    setTimeout(() => { statusEl.style.display = 'none'; }, 8000);
  }
}
