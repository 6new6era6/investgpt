  // Function to get user location info
function getLocationInfo() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://ipinfo.io/json', false);
  xhr.send();

  if (xhr.status === 200) {
      const response = JSON.parse(xhr.responseText);
      const {ip, country} = response;
      return {ip, geo: country};
  } else {
      console.error('Error fetching user info:', xhr.status);
  }
}

function blockButton() {
  const submitButton = document.querySelector("button[type='submit']");
  submitButton.disabled = true; 
  document.getElementById("btnSubmit").style.backgroundColor = '#808080';
  document.getElementById("btnSubmit").style.border = '0px';
 }
  
  document.addEventListener("DOMContentLoaded", function() {
                                                               // Находим элементы ввода
   const input = document.querySelector("input[name='prephone']");
   const emailInput = document.querySelector("input[name='email']");
    const countryCodeInput = document.getElementById("country_code");
    const countryNameInput = document.getElementById("country_name");
    const button = document.querySelector("button[type='submit']");
    const checkbox = document.getElementById("riskDisclaimer");                                                              
                                                                  const emailError = document.getElementById("email-error");
                                                                  const phoneError = document.getElementById("phone-error");
                                                                  
                                                                  // Проверка, что все элементы существуют
                                                                  if (!input || !emailInput || !button || !emailError || !phoneError) {
                                                                    console.error("One or more elements are not found in the DOM.");
                                                                    return;
                                                                  }
                                                            

                                                                   
                                                                  // Сообщения об ошибках
                                                                  const errorMap = ["Geçersiz numara", "Geçersiz ülke кодu", "Çok kısa", "Çok uzun", "Geçersiz numara"];
                                                            
                                                                  // Инициализация intl-tel-input с нужными параметрами
                                                                  const iti = window.intlTelInput(input, {
                                                                    initialCountry: getLocationInfo().geo.toLowerCase(),
                                                                    separateDialCode: true,
                                                                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/20.1.0/js/utils.js"
                                                                  });
                                                            
                                                                  // Функция для сброса состояния ввода
                                                                  const reset = () => {
                                                                    input.classList.remove("error");
                                                                    emailInput.classList.remove("error");
                                                                    emailError.innerHTML = "";
                                                                    phoneError.innerHTML = "";
                                                                  };
                                                            
                                                            
                                                                  // Функция для обновления кода страны
                                                                  const updateCountryCode = () => {
                                                                    if (countryCodeInput) {
                                                                      const countryCode = iti.getSelectedCountryData().dialCode;
                                                                      countryCodeInput.value = countryCode;
                                                                      validatePhone()
                                                                    }
                                                                  };
                                                            
                                                                  // Функция для обновления названия страны
                                                                  const updateCountryName = () => {
                                                                    if (countryNameInput) {
                                                                      const countryName = iti.getSelectedCountryData().iso2;
                                                                      countryNameInput.value = countryName;
                                                                    }
                                                                  };
                                                                  
                                                                  // Обновление информации о стране после инициализации
                                                                  iti.promise.then(() => {
                                                                    updateCountryCode();
                                                                    updateCountryName();
                                                                    
                                                                  });
                                                            
                                                                  // Обновление информации о стране при изменении страны
                                                                 
                                                                  input.addEventListener('countrychange', () => {
                                                                    updateCountryCode();
                                                                    updateCountryName();
                                                                    
                                                                  });
                                                            
                                                                  // Автоматическое форматирование номера при вводе
                                                                  input.addEventListener('input', function() {
                                                                    this.value = this.value.replace(/\D/g, '');
                                                                    var cursorPosition = input.selectionStart;
                                                                    iti.setNumber(input.value);
                                                                    input.setSelectionRange(cursorPosition, cursorPosition);
                                                                    validatePhone()
                                                                  });
                                                            
                                                                  // Обработчик нажатия на кнопку отправки
                                                                  button.addEventListener('click', (event) => {
                                                                    reset();
                                                                    
                                                                    let valid = true;
                                                            
                                                                    // Проверка email
                                                                    if (!validateEmail(emailInput.value)) {
                                                                      valid = false;
                                                                    }
                                                            
                                                                    
                                                                    // Проверка номера телефона
                                                                    if (!input.value.trim()) {
                                                                      valid = false;
                                                                      showError("Required", input);
                                                                    } else if (!iti.isValidNumber()) {
                                                                      valid = false;
                                                                      const errorCode = iti.getValidationError();
                                                                      const msg = errorMap[errorCode] || "Geçersiz numara";
                                                                      showError(msg, input);
                                                                    }

                                                                    if (!valid) {
                                                                      event.preventDefault();
                                                                      console.log('button click')
                                                                    } else {
                                                                      console.log('valid')

                                                                    }

                                                                    // if (!checkbox.checked) {
                                                                    //   valid = false;
                                                                    //   checkbox.classList.add("error-checkbox");
                                                                    // }
                                                                
                                                                    if (!valid) {
                                                                      event.preventDefault();
                                                                    }
                                                                  });

                                                            
                                                                  // Функция для валидации email
                                                                  function validateEmail(email) {
                                                                    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                                                                    return re.test(String(email).toLowerCase());
                                                                  }

                                                                  function validatePhone() {
                                                                            const phonePlaceholder = document.getElementById("phone");
                                                                            let phoneLength = phonePlaceholder.getAttribute("placeholder").length;
                                                                            phonePlaceholder.setAttribute('maxlength', phoneLength);
                                                                        }
                                                                
                                                            
                                                                  // Сброс состояния ввода при изменении или вводе данных
                                                                  input.addEventListener('change', reset);
                                                                  input.addEventListener('keyup', reset);
                                                                  emailInput.addEventListener('change', reset);
                                                                  emailInput.addEventListener('keyup', reset);
                                                                  //checkbox.classList.remove("error-checkbox");
                                                                  const urlParams = new URLSearchParams(window.location.search);
                                                                    document.querySelector("input[name='utm_campaign']").value = urlParams.get('utm_campaign') || "";
                                                                    document.querySelector("input[name='utm_source']").value = urlParams.get('utm_source') || "";
                                                                    document.querySelector("input[name='utm_placement']").value = urlParams.get('utm_placement') || "";
                                                                    document.querySelector("input[name='campaign_id']").value = urlParams.get('campaign_id') || "";
                                                                    document.querySelector("input[name='adset_id']").value = urlParams.get('adset_id') || "";
                                                                    document.querySelector("input[name='ad_id']").value = urlParams.get('ad_id') || "";
                                                                    document.querySelector("input[name='adset_name']").value = urlParams.get('adset_name') || "";
                                                                    document.querySelector("input[name='ad_name']").value = urlParams.get('ad_name') || "";
                                                                    document.querySelector("input[name='mbr']").value = urlParams.get('mbr') || "";
                                                                    document.querySelector("input[name='pxl']").value = urlParams.get('pixel') || "";
                                                                    document.querySelector("input[name='pxlm']").value = urlParams.get('pxlm') || "";
                                                                });
                                                                
                                                            