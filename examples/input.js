import 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';

const choices = document.querySelectorAll('div[class="field"]');
const textArea = document.querySelector('#map-text');

choices.forEach((choice) => {
  choice.addEventListener('click', (event) => {
      choice.querySelector('input[type="radio"]').checked = true

      const options = jsyaml.load(textArea.value, 'utf8');
      const field = choice.querySelector('input').name
      var value = choice.dataset.value

      if (! value) {
        value = choice.querySelector('input[type="text"]').value
      }
      if (choice.dataset.type == "boolean") {
        value = value === 'true'
      }

      options[field] = value
      textArea.value = jsyaml.dump(options);
  });
});

const textInputs = document.querySelectorAll('input[type="text"]');
textInputs.forEach((input) => {
  input.addEventListener('focusout', (event) => {
    input.parentElement.click()
  });
});
