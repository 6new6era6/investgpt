let ipInfo = getLocationInfo();

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

const dataLang = {
    languages = {
    de: {
        language: "de",
        registrationTitle: "Bestätigen Sie Ihre Registrierung!",
        registrationText: "Um die Registrierung abzuschließen, müssen Sie Ihre zuvor im Formular angegebenen Daten erneut eingeben. Damit bestätigen Sie Ihre Absicht, und unser Manager wird Sie schneller anrufen!",
        name: "Vorname",
        surname: "Nachname",
        email: "E-Mail",
    },
    en: {
        language: "en",
        registrationTitle: "Confirm your registration!",
        registrationText: "To complete the registration, you need to re-enter the data you previously provided in the form. This confirms your intention, and our manager will call you faster!",
        name: "First Name",
        surname: "Last Name",
        email: "Email",
    },
    ru: {
        language: "ru",
        registrationTitle: "Подтвердите вашу регистрацию!",
        registrationText: "Чтобы завершить регистрацию, необходимо ещё раз ввести данные, оставленные ранее в форме. Тем самым вы подтверждаете свои намерения, и наш менеджер свяжется с вами быстрее!",
        name: "Имя",
        surname: "Фамилия",
        email: "Электронная почта",
    },
    uk: {
        language: "uk",
        registrationTitle: "Підтвердіть свою реєстрацію!",
        registrationText: "Для завершення реєстрації потрібно ще раз ввести свої дані, залишені у формі раніше. Цим ви підтверджуєте свої наміри, і наш менеджер зателефонує вам швидше!",
        name: "Ім'я",
        surname: "Прізвище",
        email: "Електронна пошта",
    },
    fr: {
        language: "fr",
        registrationTitle: "Confirmez votre inscription !",
        registrationText: "Pour finaliser l'inscription, vous devez saisir à nouveau les données que vous avez précédemment fournies dans le formulaire. Cela confirme votre intention et notre manager vous appellera plus rapidement !",
        name: "Prénom",
        surname: "Nom",
        email: "Email",
    },
    pl: {
        language: "pl",
        registrationTitle: "Potwierdź swoją rejestrację!",
        registrationText: "Aby zakończyć rejestrację, musisz ponownie wprowadzić dane podane wcześniej w formularzu. Potwierdzasz tym samym swoje zamiary, a nasz menedżer zadzwoni do Ciebie szybciej!",
        name: "Imię",
        surname: "Nazwisko",
        email: "Email",
    },
    cs: {
        language: "cs",
        registrationTitle: "Potvrďte svou registraci!",
        registrationText: "Pro dokončení registrace musíte znovu zadat údaje, které jste dříve uvedli ve formuláři. Tím potvrdíte svůj úmysl a náš manažer vám zavolá rychleji!",
        name: "Jméno",
        surname: "Příjmení",
        email: "Email",
    },
    it: {
        language: "it",
        registrationTitle: "Conferma la tua registrazione!",
        registrationText: "Per completare la registrazione devi reinserire i dati che hai precedentemente fornito nel modulo. In questo modo confermi la tua intenzione e il nostro manager ti chiamerà più rapidamente!",
        name: "Nome",
        surname: "Cognome",
        email: "Email",
    },
    ja: {
        language: "ja",
        registrationTitle: "登録を確認してください！",
        registrationText: "登録を完了するには、以前フォームに入力した情報をもう一度入力する必要があります。これにより意思が確認され、マネージャーがより早くご連絡いたします！",
        name: "名",
        surname: "姓",
        email: "メール",
    },
    ro: {
        language: "ro",
        registrationTitle: "Confirmă-ți înregistrarea!",
        registrationText: "Pentru a finaliza înregistrarea, trebuie să introduci din nou datele completate anterior în formular. Astfel îți confirmi intențiile și managerul nostru te va contacta mai repede!",
        name: "Prenume",
        surname: "Nume",
        email: "Email",
    },
}

};

//let loc = ipInfo.geo.toLowerCase()
let loc = navigator.language.split('-')[0];


const registrationTitle = document.getElementById("registrationTitle");
const registrationText = document.getElementById("registrationText");
const mainTitle = document.getElementById("mainTitle");
const form_name = document.getElementById("form__name");
const form_last = document.getElementById("form__last");
const form_email = document.getElementById("form__email");
const lead_submit = document.getElementById("lead__submit");
const cookieContent = document.getElementById("cookieContent");
const policyContent = document.getElementById("policyContent");
const termsContent = document.getElementById("termsContent");
const disclaimerContent = document.getElementById("disclaimerContent");
const andText = document.getElementById("andText");
switch (loc) {
  case loc: 
    registrationTitle.textContent = dataLang.languages[loc].registrationTitle;
    registrationText.textContent = dataLang.languages[loc].registrationText;
    form_name.placeholder = dataLang.languages[loc].name;
    form_last.placeholder = dataLang.languages[loc].surname;
    form_email.placeholder = dataLang.languages[loc].email;
    lead_submit.textContent = dataLang.languages[loc].submitBtn;
    policyContent.textContent = dataLang.languages[loc].policy;
    termsContent.textContent = dataLang.languages[loc].terms;
    disclaimerContent.textContent = dataLang.languages[loc].disclaimer;
    andText.textContent = dataLang.languages[loc].andText;
    break;
};

