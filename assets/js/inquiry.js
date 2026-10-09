/* =============================================
   VNGroup Tourist - contact and booking forms
   ---------------------------------------------
   The backend has no public endpoint for enquiries yet, so a form
   opens the visitor's email app with the message already written,
   addressed to the company inbox. Nothing is sent from the page
   itself and no payment is taken.

   Usage: <form data-inquiry="Subject line"> with fields carrying
   name="" and data-label="" (the label used in the email body).
   An element with [data-inquiry-sent] inside the form is shown
   after the email app is opened. If it holds a <textarea>, the whole
   message goes in it, with a [data-inquiry-copy] button, for people
   whose browser has no email app (Gmail on the web, many phones).
   ============================================= */

(function () {
    const EMAIL = 'info@vngrouptourist.com';

    function body(form) {
        const lines = [];
        form.querySelectorAll('[name]').forEach(el => {
            const value = (el.value || '').trim();
            if (!value) return;
            const label = el.dataset.label || el.name;
            lines.push(el.tagName === 'TEXTAREA' ? `\n${label}:\n${value}` : `${label}: ${value}`);
        });
        return lines.join('\n');
    }

    document.querySelectorAll('form[data-inquiry]').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!form.reportValidity()) return;

            const name = form.querySelector('[name="name"]')?.value.trim();
            const subject = form.dataset.inquiry + (name ? ' - ' + name : '');
            const text = body(form);
            window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

            const sent = form.querySelector('[data-inquiry-sent]');
            if (!sent) return;
            sent.classList.remove('hidden');
            const box = sent.querySelector('textarea');
            if (box) box.value = `To: ${EMAIL}\nSubject: ${subject}\n\n${text}`;
        });
    });

    document.querySelectorAll('[data-inquiry-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const box = btn.closest('[data-inquiry-sent]')?.querySelector('textarea');
            if (!box) return;
            try {
                await navigator.clipboard.writeText(box.value);
            } catch (e) {
                box.select();
                document.execCommand('copy');
            }
            btn.textContent = 'Copied';
            setTimeout(() => { btn.textContent = 'Copy message'; }, 2000);
        });
    });
})();
