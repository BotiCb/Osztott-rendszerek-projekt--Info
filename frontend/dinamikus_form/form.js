window.onload = async () => {
    const response = await fetch('questions.json');
    const questions = await response.json();
  
    const form = document.getElementById('dynamic-form');
    const loader = document.getElementById('loader');
  
    loader.style.display = 'none';
    form.style.display = 'block';
  
    questions.forEach((q, index) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('form-group');
      wrapper.style.animationDelay = `${index * 0.1}s`;
  
      const label = document.createElement('label');
      label.innerText = q.label;
      label.htmlFor = q.name;
  
      const input = document.createElement('input');
      input.type = q.type;
      input.name = q.name;
      input.id = q.name;
      if (q.required) input.required = true;
  
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      form.appendChild(wrapper);
    });
  
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.innerText = 'Küldés';
    submit.classList.add('submit-btn');
    form.appendChild(submit);
  
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      const entries = Object.fromEntries(formData.entries());
      console.log("Beküldött adatok:", entries);
      alert("Sikeresen beküldve! Nézd meg a konzolt.");
    });
  };
  