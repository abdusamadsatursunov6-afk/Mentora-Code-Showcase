// V29 — native sharing UX with clipboard fallback for public presentations.
(() => {
  document.documentElement.dataset.bundleVersion = '29';

  const lang = document.documentElement.lang || 'ru';
  const labels = {
    ru: { label: 'Поделиться', title: 'Поделиться Mentora', copied: 'Ссылка скопирована' },
    en: { label: 'Share', title: 'Share Mentora', copied: 'Link copied' },
    uz: { label: 'Ulashish', title: 'Mentora bilan ulashish', copied: 'Havola nusxalandi' }
  };
  const copy = labels[lang] || labels.ru;

  const actions = document.querySelector('.contact-actions');
  if (!actions) return;

  let button = actions.querySelector('.share-product-link');
  if (!button) {
    button = document.createElement('button');
    button.className = 'btn btn-outline-dark magnetic share-product-link';
    button.type = 'button';
    button.dataset.shareLabel = copy.label;
    button.dataset.shareTitle = copy.title;
    button.dataset.copiedLabel = copy.copied;
    button.setAttribute('aria-label', copy.label);
    button.innerHTML = `<span class="share-label">${copy.label}</span> <span aria-hidden="true">↗</span>`;
    actions.appendChild(button);
  }

  const getShareUrl = () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    return canonical || 'https://mentoraedu.uz';
  };

  const announce = message => {
    const toast = document.getElementById('siteToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const fallbackCopy = async url => {
    try {
      await navigator.clipboard.writeText(url);
      announce(button.dataset.copiedLabel || copy.copied);
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      announce(button.dataset.copiedLabel || copy.copied);
    }
  };

  button.addEventListener('click', async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: button.dataset.shareTitle || copy.title, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await fallbackCopy(url);
  });
})();
