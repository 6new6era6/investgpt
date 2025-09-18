class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "Validation Error"; 
    }
}

function getCountryCode(callback) {
    $.get("https://ipinfo.io", function(response) {
        if (response && response.country) {
            callback(response.country.toLowerCase());
        } else {
            callback('us'); // Встановлюємо 'us' за замовчуванням, якщо код країни не знайдено
        }
    }, "jsonp");
}

$(document).ready(function () {
    try {
        var _country = 'us'; // Код країни за замовчуванням
var _language = 'en'; // Мова за замовчуванням

function formatPhoneNumber(inputElement) {
    var iti = $(inputElement).data("iti");
    var placeholder = inputElement.getAttribute("placeholder"); // Отримуємо значення placeholder

    if (placeholder) {
        var cleanValue = inputElement.value.replace(/\D/g, ''); // Видаляємо всі символи, крім цифр
        var formattedNumber = '';
        var index = 0;

        // Форматуємо номер відповідно до формату placeholder
        for (var i = 0; i < placeholder.length; i++) {
            if (index >= cleanValue.length) {
                break;
            }
            if (placeholder[i] === ' ') {
                formattedNumber += ' ';
            } else {
                formattedNumber += cleanValue[index];
                index++;
            }
        }
        inputElement.value = formattedNumber;
    }
}

// Отримуємо код країни і ініціалізуємо плагін intlTelInput
getCountryCode(function (countryCode) {
    _country = countryCode;

    // Ініціалізація телефонного вводу з кодом країни
    var telCode = $("input[name=prephone]");
    telCode.each(function (indx, value) {
        var iti = window.intlTelInput(value, {
            initialCountry: _country, // Встановлюємо початковий код країни
            separateDialCode: true,   // Відображення коду країни окремо
            autoPlaceholder: "aggressive", // Агресивне заповнення підказки
            preferredCountries: [_country], // Додаємо як пріоритетну країну
            nationalMode: false, // Використовуємо міжнародний формат номера
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js" // Підключення утиліт для форматування
        });

        // Збереження вибраного телефону для подальшого використання
        $(value).data("iti", iti);

        // Оновлюємо початкові значення прихованих полів для країни
        var selectedCountryData = iti.getSelectedCountryData();
        $("#country_name").val(selectedCountryData.iso2);
        $("#country_code").val(selectedCountryData.dialCode);

        // Викликаємо функцію валідації та форматування після ініціалізації intlTelInput
        validatePhoneLength();

        // Оновлення значень прихованих полів при зміні вибраної країни
        $(value).on("countrychange", function () {
            selectedCountryData = iti.getSelectedCountryData();
            $("#country_name").val(selectedCountryData.iso2);
            $("#country_code").val(selectedCountryData.dialCode);

            // Оновлюємо maxlength для нового значення placeholder
            validatePhoneLength();
        });

        // Форматування введених даних у телефонному полі
        $(value).on("input", function () {
            formatPhoneNumber(this);
        });
    });
});


        // Встановлюємо максимальну довжину телефону на основі placeholder
        function validatePhoneLength() {
            var telInputs = $("input[name=prephone]");
            telInputs.each(function () {
                var inputElement = $(this);

                // Використовуємо setTimeout для того, щоб дочекатися оновлення placeholder після ініціалізації
                setTimeout(function () {
                    var placeholder = inputElement.attr('placeholder'); // Отримуємо значення placeholder
                    if (placeholder) {
                        var phoneLength = placeholder.length; // Визначаємо довжину placeholder
                        inputElement.attr('maxlength', phoneLength); // Встановлюємо maxlength відповідно до довжини placeholder
                        console.log("Placeholder found:", placeholder, "Length set to:", phoneLength);
                    } else {
                        console.log("Placeholder not found, setting default maxlength to 20.");
                        inputElement.attr('maxlength', 15); // За замовчуванням встановлюємо 20, якщо placeholder не знайдено
                    }
                }, 2000); // Затримка 100 мс
            });
        }

        var send_password = $("form input[name=password]").length > 0;

        var forms = $('form[id^=myform]')
        if(forms.length < 1) {
            throw new ValidationError('Form doesn\'t exist');
        }

        for (var i = 0; i < forms.length; i++) {
            var form = forms[i];
            var all_pasword_fealds_are_defined = $(form).find("input[name='password']").length > 0
            && $(form).find(".valid-check-A-Z").length > 0
            && $(form).find(".valid-check-a-z").length > 0
            && $(form).find(".valid-check-1-9").length > 0
            && $(form).find(".valid-check-alphanumeric").length > 0
            && $(form).find(".valid-check-length").length > 0
            && $(form).find(".password-btn").length > 0;


            var at_least_one_pasword_feald_is_defined = $(form).find("input[name='password']").length > 0
            || $(form).find(".valid-check-A-Z").length > 0
            || $(form).find(".valid-check-a-z").length > 0
            || $(form).find(".valid-check-1-9").length > 0
            || $(form).find(".valid-check-alphanumeric").length > 0
            || $(form).find(".valid-check-length").length > 0
            || $(".password-btn").length > 0;

            if ($(form).find("input[name='name']").length < 1 
                || $(form).find("input[name='last']").length < 1
                || $(form).find("input[name='email']").length < 1
                || $(form).find("input[name='prephone']").length < 1
                || (!send_password && at_least_one_pasword_feald_is_defined) || (send_password && !all_pasword_fealds_are_defined)
            ) {
                throw new ValidationError('Form #'+ $(form).attr('id') +' has the wrong format');   
            }

        }

        //validation block
        var regex_first_last_name = new RegExp('^([A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\u0E00-\u0E7F.-]\\s{0,}?)+$');

        function rebuidEmail(this_element){
            var tmp_el = this_element.val();
            tmp_el = tmp_el.replace(/[\.+]{2,}/g, '.').replace(/^\.+/g, '').replace(/\.+$/g, '').replace(/[,\/]/g, '.'); // заменяем повторяющиеся точки на одну, убираем точки вначале и в конце, заменяем запятую и слеш на точку

            //=========
            tmp_el = tmp_el.replace(/[.]+\s+com$/g, '.com').replace(/\s+com$/g, '.com'); // убираем лишние точки и пробелы перед com
            tmp_el = tmp_el.replace(/[.]+\s+ru$/g, '.ru').replace(/\s+ru$/g, '.ru'); // убираем лишние точки и пробелы перед ru
            tmp_el = tmp_el.replace(/[.]+\s+net$/g, '.net').replace(/\s+net$/g, '.net'); // убираем лишние точки и пробелы перед net
            tmp_el = tmp_el.replace(/[.]+\s+ua$/g, '.ua').replace(/\s+ua$/g, '.ua'); // убираем лишние точки и пробелы перед ua
            //=========

            var brokenDomainsGmail = ['gmil','gmaail','gmaij','gmaila', 'gmaile', 'googlemail','jimail','gmailcom','gimailcom','gaiml','gemail','gilmei','gmael','gmaol','gamail','gamil','glail','gmaik'];
            brokenDomainsGmail.forEach((element) => {     // правка домена gmail
                tmp_el = tmp_el.replace(element, 'gmail');
            });

            var brokenDomainsYandex = ['yande[','jandex'];
            brokenDomainsYandex.forEach((element) => {     // правка домена yandex
                tmp_el = tmp_el.replace(element, 'yandex');
            });

            var brokenDomainsMail = ['email', 'meil'];
            brokenDomainsMail.forEach((element) => {     // правка домена mail.ru
                tmp_el = tmp_el.replace(element, 'mail');
            });

            //=========
            tmp_el = tmp_el.replace(/gmail$/g, 'gmail.com'); // правка на домен первого уровня
            tmp_el = tmp_el.replace(/mail$/g, 'mail.ru'); // правка на домен первого уровня
            tmp_el = tmp_el.replace(/mail\.ry$/g, 'mail.ru'); // правка на домен первого уровня
            //=========
            tmp_el = tmp_el.replace(/\s+/g, '').replace(/[/.]{2,}/g, '.'); // убираем лишние пробелы и повторяющиеся точки
            tmp_el = tmp_el.replace(/@\s+/g, '@').replace(/\s+@/g, '@'); // убираем лишние пробелы до и после собачки
            tmp_el = tmp_el.replace(/[.]+@/g, '@').replace(/@[.]+/g, '@'); // убираем лишние точки до и после собачки

            $('[name=email]').val(tmp_el) //вставляем во все инпуты с именем емейл
        }

        //обьект для памяти кликов по формам перед вызовом автогенератора
        var form_counter = new Object();
        $('form').each(function(i){
            form_counter[$(this)[0].id] = {
                count : 2,
                callCount : function(){ return this.count },
                editCount : function(){ this.count-- }
            }
        })

        // генератор паролей для форм + проброс
        function generator_password(form){
            form_counter[ form[0].id ].editCount()
            if (form_counter[ form[0].id ].callCount() < 1){
                var possible1 = '0123456789';
                var possible2 = 'abcdefghijklmnopqrstuvwxyz';
                var possible3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                var tmpGenPass = 'Gn';
                for (var i = 0; i <2; i++) {
                    tmpGenPass += possible1.charAt(Math.floor(Math.random() * possible1.length));
                    tmpGenPass += possible2.charAt(Math.floor(Math.random() * possible2.length));
                    tmpGenPass += possible3.charAt(Math.floor(Math.random() * possible3.length));
                }
                $("input[name='password']").val(tmpGenPass)
                console.log(tmpGenPass)
            }
        }
        // уведомление после генерации нового пароля
        function alert_after_gen_pass(form){
            if ($(form).find("input[name='password']").val().length == 8 && $(form).find("input[name='password']").val().substr(0,2) == "Gn"){
                prompt(pwd_msg_lang[_language]['Your password was too weak, we generated a new strong one'] + ' " ' + $(form).find("input[name='password']").val() + ' " ' + pwd_msg_lang[_language]['Please save it!'], $(form).find("input[name='password']").val())
            }
        }


        // Custom method to validate username
        $.validator.addMethod("usernameRegex", function (value, element) {
            return this.optional(element) || regex_first_last_name.test(value);
        }, pwd_msg_lang[_language]['First name must be longer than 2 characters, without special symbols or spaces']);

        $.validator.addMethod("lastusernameRegex", function (value, element) {
            return this.optional(element) || regex_first_last_name.test(value);
        }, pwd_msg_lang[_language]['Last name must be more than 2 characters, no special symbols or spaces']);


        $.validator.addMethod("passwordRegex", function (value, element) {
            return this.optional(element) || /[a-z]/.test(value) && /[0-9]/.test(value) && /[A-Z]/.test(value) && /^[0-9A-Za-z]+$/.test(value);
        }, pwd_msg_lang[_language]['The password must be between 6 and 12 characters, including letters (A-Z, a-z) and numbers (0-9). Without special symbols (^@()_#*+/"?!=.}}~` and spaces']);


        $.validator.addMethod("phoneRegex", function (value, element) {
            return this.optional(element) || /^(\d[- ]?){7,11}$/.test(value);
        }, pwd_msg_lang[_language]['Phone number must be between 7 and 11 characters long, no special characters']);

        $.validator.addMethod("regex", function(value, element, regexp)  {
                /* Check if the value is truthy (avoid null.constructor) & if it's not a RegEx. (Edited: regex --> regexp)*/
                if (regexp && regexp.constructor != RegExp) {
                /* Create a new regular expression using the regex argument. */
                regexp = new RegExp(regexp);
                }

                /* Check whether the argument is global and, if so set its last index to 0. */
                else if (regexp.global) regexp.lastIndex = 0;

                /* Return whether the element is optional or the result of the validation. */
                return this.optional(element) || regexp.test(value);
            });

        $('form input').on("focus blur select", function () {
            if ($(this).hasClass('error') === true) {
                $('form label.error').hide();
                
            }
        })

    

        function randString(id) {
            var dataCharacterSet = "0-9,a-z,A-Z";
            var dataSet = dataCharacterSet.split(',');
            // var dataSet = $(id).attr('data-character-set').split(',');
            var possible = '';
            if ($.inArray('0-9', dataSet) >= 0) {
                possible += '0123456789';
            }
            if ($.inArray('a-z', dataSet) >= 0) {
                possible += 'abcdefghijklmnopqrstuvwxyz';
            }
            if ($.inArray('A-Z', dataSet) >= 0) {
                possible += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            }
            var text = '';
            // for (var i = 0; i < $(id).attr('data-size'); i++) {
            var dataSize = 5;
            for (var i = 0; i < dataSize; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        }


    if(send_password) {
        //*Password*//
        $('input[name=password]').click(function () {
            $('.valid-block').fadeIn(300)
        })
        $('input[name=password]').blur(function () {
            $('.valid-block').fadeOut(300)
        })
        $('input[name=password]').on("input click", function validatePass() {
            var password = $(this).val();
            var checkAZ = $(this).closest("form").find(".valid-check-A-Z")
            var checkaz = $(this).closest("form").find(".valid-check-a-z")
            var checkNum = $(this).closest("form").find(".valid-check-1-9")
            var checkLeng = $(this).closest("form").find(".valid-check-length")
            var checkAlph = $(this).closest("form").find(".valid-check-alphanumeric")
            // $('input[name=password]').val(password)

            if (password.match(/[A-Z]/) != null) {
                $(checkAZ).addClass('check')
            }
            if (password.match(/[A-Z]/) === null) {
                $(checkAZ).removeClass('check')
            }
            if (password.match(/[a-z]/) != null) {
                $(checkaz).addClass('check')
            }
            if (password.match(/[a-z]/) === null) {
                $(checkaz).removeClass('check')
            }
            if (password.match(/[1-9]/) != null) {
                $(checkNum).addClass('check')
            }
            if (password.match(/[1-9]/) === null) {
                $(checkNum).removeClass('check')
            }
            if (password.length > 7) {
                $(checkLeng).addClass('check')
            }
            if (password.length < 8 || password.length > 12) {
                $(checkLeng).removeClass('check')
            }
            if (password.match(/^[0-9A-Za-z]+$/) != null) {
                $(checkAlph).addClass('check')
            }
            if (password.match(/^[0-9A-Za-z]+$/) === null) {
                $(checkAlph).removeClass('check')
            }
            if (password.match(/[A-Z]/) != null && password.match(/[a-z]/) != null && password.match(/[1-9]/) != null && (password.length > 7 && password.length < 13) && password.match(/^[0-9A-Za-z]+$/) != null) {
                $('.valid-block').hide();
            } else {
                if (!$('.valid-block').is(':visible')) {
                    $('.valid-block').show();
                }

            }

        })


        $(".password-btn").click(function () {
            var number = Math.floor(Math.random() * (1 - 9) + 9);
            var field = $(".password-btn").closest('form').find('input[name="password"]');
            field.val(randString(field) + number + "Db");

            field.valid();
            $(this).parent().parent().find('.prephone').select();
        });
    }

    // //*Red label*//
    // let newDate = new Date();
    // let month = newDate.getMonth() + 1;
    // let day = newDate.getDate() < 10 ? '0' + newDate.getDate() : newDate.getDate();
    // let year = newDate.getFullYear();
    // if (month < 10) {
    //     month = '0' + month;
    // }
    // $('.warning-label--end').text(day + '/' + month + '/' + year);

    // var forms = ($('form')).filter(function(item){
    //     return $(item).attr('id') == 'myform1'
    // })
    // function f(e) {
    //     var id = $(e).attr('id');
    //     if(id == undefined) {
    //         return false;
    //     }
    //     return (id).indexOf('myform') !== -1;
    // }

    // var forms = $.grep($('form'), function(e) {
    //     var id = $(e).attr('id');
    //     if(id == undefined) {
    //         return false;
    //     }
    //     return (id).indexOf('myform') !== -1;
    // });
    for (var i = 0; i < forms.length; i++) {
        var form = $(forms[i])
        form.validate({
            onfocusout: function (element) {
                if(this.currentElements.length != 0 && this.currentElements[0].name == "email"){
                    rebuidEmail($(this.currentElements[0]))
                }
                this.element(element);
                $(element).valid()
            },
            onkeyup: function (element) {
                $(element).valid()
                $('[name="' + element.name + '"]').val(element.value);
            },

            rules: {
                name: {
                    required: true,
                    usernameRegex: true,
                    minlength: 2,
                    maxlength: 60,
                },
                last_name: {
                    required: true,
                    lastusernameRegex: true,
                    minlength: 2,
                    maxlength: 60,
                },
                password: {
                    required: true,
                    passwordRegex: true,
                    minlength: 8,
                    maxlength: 12,
                },
                email: {
                    required: true,
                    email: true,
                    regex: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,

                },
                phone: {
                    phoneRegex: true,
                    required: true,
                }


            },
            messages: {
                name: {
                    required: pwd_msg_lang[_language]['First name is required'],
                    minlength: pwd_msg_lang[_language]['Can contain minimum 2 letters'],
                    maxlength: pwd_msg_lang[_language]['Can contain maximum 25 letters'],
                },

                last_name: {
                    required: pwd_msg_lang[_language]['Last name is required'],
                    minlength: pwd_msg_lang[_language]['Can contain minimum 2 letters'],
                    maxlength: pwd_msg_lang[_language]['Can contain maximum 25 letters'],
                },
                password: {
                    required: pwd_msg_lang[_language]['Password is required'],
                    minlength: pwd_msg_lang[_language]['Password must be at least 8 characters'],
                    maxlength: pwd_msg_lang[_language]['Password cannot exceed 12 characters'],
                },
                phone: {
                    required: pwd_msg_lang[_language]['Phone is required'],
                }

            },
            submitHandler: function (form, event) {
                event.preventDefault();
                $('.preloader').show();
                $("input[name='name']").each(function () {
                    $(this).val($(this).val().substr(0, 60).replace(/[.-]/g, ' ').replace(/\s\s+/g, ' '))
                });
                $("input[name='last']").each(function () {
                    $(this).val($(this).val().substr(0, 60).replace(/[.-]/g, ' ').replace(/\s\s+/g, ' '))
                });
                if(send_password) {
                    alert_after_gen_pass(form);
                }
                // $('#finishPopup').fadeIn(150);
                
                if (typeof ym !== 'undefined' && typeof ym_c !== 'undefined') {
                    if (!document.cookie.split(';').some((item) => item.trim().startsWith('formsubmitvalid=')) && typeof window.formsubmitvalid == 'undefined') {
                        ym(ym_c, 'reachGoal', 'form_submitted_valid');
                        let coockieExpiresIntervalSec = 120;
                        let coockieExp = new Date(); coockieExp.setTime(coockieExp.getTime() + 1000 * coockieExpiresIntervalSec); document.cookie = "formsubmitvalid=true; SameSite=Lax; expires=" + coockieExp.toUTCString();
                        window.formsubmitvalid = true;
                    }
                }
                
                form.submit();

            }
        });
        if(send_password){
            $(form).submit(function () {      
                //тригеримся только на ошибку по паролю
                if ($(form).find("input[name='name']").hasClass("valid") &&
                    $(form).find("input[name='last']").hasClass("valid") &&
                    $(form).find("input[name='email']").hasClass("valid") &&
                    $(form).find("input[name='prephone']").hasClass("valid") &&
                    $(form).find("input[name='password']").hasClass("error")) {
                    //после 2-й неудачной попытки пройти далее генерим пароль
                    generator_password(form)
                    if (form.valid()){

                        if (typeof ym !== 'undefined' && typeof ym_c !== 'undefined') {
                            if (!document.cookie.split(';').some((item) => item.trim().startsWith('formsubmitvalid=')) && typeof window.formsubmitvalid == 'undefined') {
                                ym(ym_c, 'reachGoal', 'form_submitted_valid');
                                let coockieExpiresIntervalSec = 120;
                                let coockieExp = new Date(); coockieExp.setTime(coockieExp.getTime() + 1000 * coockieExpiresIntervalSec); document.cookie = "formsubmitvalid=true; SameSite=Lax; expires=" + coockieExp.toUTCString();
                                window.formsubmitvalid = true;
                            }
                        }
                        
                        form.submit()
                    }
                }  
            })
        }
      }
    } catch(error) {
        console.error(error.name + ': '+ error.message)
        console.log('something wrong')
    }
});
