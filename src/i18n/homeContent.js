// Text for the information section under the calculator on the home page
// (src/components/home/HomeInfo.jsx). The English version is also written
// into index.html at build time (see vite.config.js), so the page has real,
// readable content even before the app's code has loaded.

export const homeContent = {
  en: {
    title: 'Split any restaurant bill fairly, in seconds',
    intro:
      'reCalc is a free bill-splitting calculator. Everyone pays for exactly what they ordered, plus their fair share of VAT, service charge and any discount. No more dividing the total equally when one person had a coffee and another had a three-course dinner.',
    howTitle: 'How it works',
    how: [
      {
        title: 'Scan or type the receipt',
        text: 'Take a photo of the receipt and reCalc reads the items and prices for you, in Arabic or English. Or type the totals and each person’s order yourself.',
      },
      {
        title: 'Say who ordered what',
        text: 'Assign each item to a person, split shared items between several people, or send your friends a link so each one ticks their own items on their phone.',
      },
      {
        title: 'Everyone sees what they owe',
        text: 'Tax, service and discount are divided in proportion to each person’s order. Share the result as an image and keep track of who has paid you back.',
      },
    ],
    featuresTitle: 'What you can do with reCalc',
    features: [
      'Read printed receipts automatically from a photo, including Arabic receipts.',
      'Split shared items, such as a large water or a dessert, between some or all of the group.',
      'Let friends choose their own items from a shared link or QR code, with no account needed.',
      'Add a tip, which is divided equally between everyone.',
      'Record who paid the bill, even if several people paid part of it, and tick people off as they pay back.',
      'Save groups of friends, favorite names and your past calculations when you sign in.',
      'Use it in English or Arabic, on any phone or computer, without installing anything.',
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      {
        q: 'How is VAT and service divided?',
        a: 'In proportion to what each person ordered. If your order is 40% of the items total, you pay 40% of the VAT and service. This is fairer than splitting the extras equally, because the restaurant charged them on the items.',
      },
      {
        q: 'What is the difference between the total and the sub-total?',
        a: 'The sub-total is the price of the items before tax and service. The total (often printed as "Total due") is the final amount on the receipt. reCalc needs both to work out each person’s share of the extras.',
      },
      {
        q: 'Is reCalc free?',
        a: 'Yes. Splitting bills, scanning receipts and sharing results are free. The site is supported by advertising.',
      },
      {
        q: 'Do I need an account?',
        a: 'No. Anyone can split a bill as a guest. An account lets you keep your history, save groups of friends and share bills with a link. Friends who open a shared link never need an account.',
      },
      {
        q: 'What if the scan reads something wrong?',
        a: 'Every scanned value appears in an editable box before you continue, and reCalc checks that the items add up to the sub-total. Fix any line that is wrong, or enter the values by hand.',
      },
      {
        q: 'Is my receipt stored?',
        a: 'The photo is used only to read the receipt and is not kept. If you are signed in, the final calculation is saved to your own history, which you can delete at any time.',
      },
    ],
  },
  ar: {
    title: 'قسّم أي فاتورة مطعم بعدل في ثوانٍ',
    intro:
      'reCalc حاسبة مجانية لتقسيم الفواتير. يدفع كل شخص ثمن ما طلبه بالضبط، مع نصيبه العادل من الضريبة والخدمة وأي خصم. لا داعي لتقسيم الإجمالي بالتساوي عندما يطلب أحدهم قهوة فقط ويطلب آخر عشاءً كاملاً.',
    howTitle: 'كيف يعمل',
    how: [
      {
        title: 'امسح الفاتورة أو اكتبها',
        text: 'التقط صورة للفاتورة وسيقرأ reCalc الأصناف والأسعار بدلاً منك، بالعربية أو الإنجليزية. أو اكتب الإجماليات وطلب كل شخص بنفسك.',
      },
      {
        title: 'حدّد من طلب ماذا',
        text: 'أسند كل صنف لشخص، أو قسّم الأصناف المشتركة بين عدة أشخاص، أو أرسل لأصدقائك رابطًا ليختار كل منهم أصنافه من هاتفه.',
      },
      {
        title: 'يرى الجميع ما عليهم',
        text: 'تُقسَّم الضريبة والخدمة والخصم بنسبة طلب كل شخص. شارك النتيجة كصورة وتابع من سدّد لك.',
      },
    ],
    featuresTitle: 'ماذا يمكنك أن تفعل مع reCalc',
    features: [
      'قراءة الفواتير المطبوعة تلقائيًا من صورة، بما فيها الفواتير العربية.',
      'تقسيم الأصناف المشتركة، مثل زجاجة مياه كبيرة أو حلوى، بين بعض الأشخاص أو الجميع.',
      'السماح لأصدقائك باختيار أصنافهم من رابط أو رمز QR مشترك، دون الحاجة إلى حساب.',
      'إضافة إكرامية تُقسَّم بالتساوي على الجميع.',
      'تسجيل من دفع الفاتورة، حتى لو دفع أكثر من شخص جزءًا منها، ومتابعة من سدّد.',
      'حفظ مجموعات الأصدقاء والأسماء المفضلة وحساباتك السابقة عند تسجيل الدخول.',
      'الاستخدام بالعربية أو الإنجليزية، على أي هاتف أو كمبيوتر، دون تثبيت أي شيء.',
    ],
    faqTitle: 'الأسئلة الشائعة',
    faq: [
      {
        q: 'كيف تُقسَّم الضريبة والخدمة؟',
        a: 'بنسبة ما طلبه كل شخص. إذا كان طلبك 40% من إجمالي الأصناف، تدفع 40% من الضريبة والخدمة. هذا أعدل من تقسيمها بالتساوي، لأن المطعم يحسبها على الأصناف.',
      },
      {
        q: 'ما الفرق بين الإجمالي وإجمالي الطلبات؟',
        a: 'إجمالي الطلبات هو سعر الأصناف قبل الضريبة والخدمة. الإجمالي هو المبلغ النهائي المكتوب في الفاتورة. يحتاج reCalc إلى الاثنين ليحسب نصيب كل شخص من الإضافات.',
      },
      {
        q: 'هل reCalc مجاني؟',
        a: 'نعم. تقسيم الفواتير ومسحها ومشاركة النتائج كلها مجانية. يُموَّل الموقع من الإعلانات.',
      },
      {
        q: 'هل أحتاج إلى حساب؟',
        a: 'لا. يمكن لأي شخص تقسيم الفاتورة كضيف. الحساب يتيح لك حفظ سجلك ومجموعات أصدقائك ومشاركة الفواتير برابط. ولا يحتاج الأصدقاء الذين يفتحون الرابط إلى حساب.',
      },
      {
        q: 'ماذا لو أخطأ المسح في قراءة شيء؟',
        a: 'تظهر كل القيم الممسوحة في خانات قابلة للتعديل قبل المتابعة، ويتحقق reCalc من أن مجموع الأصناف يساوي إجمالي الطلبات. صحّح أي سطر خاطئ أو أدخل القيم يدويًا.',
      },
      {
        q: 'هل تُحفظ صورة فاتورتي؟',
        a: 'تُستخدم الصورة فقط لقراءة الفاتورة ولا يتم الاحتفاظ بها. إذا كنت مسجلاً للدخول، يُحفظ الحساب النهائي في سجلك الخاص، ويمكنك حذفه في أي وقت.',
      },
    ],
  },
};
