window.onload = async () => {
  // JSON kérdések betöltése
  const resp = await fetch('/static/questions.json');
  const questions = await resp.json();

  const form = document.getElementById('dynamic-form');
  const loader = document.getElementById('loader');

  loader.style.display = 'none';
  form.style.display = 'block';

  // Inputok generálása
  questions.forEach((q, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    wrapper.style.animationDelay = `${i * 0.1}s`;

    const label = document.createElement('label');
    label.htmlFor = q.name;
    label.innerText = q.label;

    const input = document.createElement('input');
    input.type = q.type;
    input.name = q.name;
    input.id   = q.name;
    if (q.required) input.required = true;

    wrapper.append(label, input);
    form.insertBefore(wrapper, form.querySelector('input[name="version"]'));
  });

  // Queue to manage submission traffic
  const queue = [];
  let processing = false;

  // Process next item in queue
  const processQueue = async () => {
    if (processing || queue.length === 0) return;
    processing = true;

    const { data, resolve, reject } = queue.shift();

    try {
        const res = await fetch('/kijelzo/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: data
        });

        if (res.status === 200) {
            const { new_version } = await res.json();
            document.getElementById('version').value = new_version;
            // Success silently handled
            resolve(res);
        }
        else if (res.status === 409) {
            // Collision: silently enqueue retry with updated version
            const { new_version } = await res.json();
            const currentVersion = new_version;  // Updated version
            const params = new URLSearchParams(data);
            params.set('version', currentVersion);
            queue.push({ data: params.toString(), resolve, reject });
        }
        else {
            console.error('Update error, status:', res.status);
            reject(res);
        }
    } catch (err) {
        console.error('Network error, retrying:', err);
        // On network error, re-enqueue silently
        queue.push({ data, resolve, reject });
    } finally {
        processing = false;
        // Delay slightly before next
        setTimeout(processQueue, 100);
    }
};


  // Submit kezelése
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new URLSearchParams(new FormData(form)).toString();

    return new Promise((resolve, reject) => {
      queue.push({ data, resolve, reject });
      processQueue();
    });
  });
};
