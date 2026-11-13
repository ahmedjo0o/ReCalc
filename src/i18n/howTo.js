// Text for the "How to use" page (src/pages/HowToPage.jsx). Kept apart from
// translations.js because it is long-form content used by one page only.
// Each step's `image` is a file name under /screenshots/how-to/<language>/.

export const howToContent = {
  en: {
    title: 'How to use reCalc',
    intro:
      'reCalc splits a restaurant or café bill fairly: everyone pays for what they ordered, plus their share of tax and service. There are two ways to do it. Pick the one that suits you.',
    scanTab: '📷 Scan the receipt',
    manualTab: '✍️ Enter manually',
    startTitle: 'Start: choose how to split',
    startText:
      'On the home page, choose Scan Receipt to let the app read a photo of the bill, or Enter Manually to type the amounts yourself.',
    scanTitle: 'Way 1: Scan the receipt',
    scanIntro: 'Best when you have the printed receipt in front of you. The app reads the items and prices for you.',
    manualTitle: 'Way 2: Enter manually',
    manualIntro: 'Best when you have no receipt, a blurry one, or you already know what each person owes.',
    scanSteps: [
      {
        title: 'Take or upload a photo',
        text: 'Tap Take Photo to use your camera, or Upload Photo to pick a picture you already have. Then tap Extract Data. Reading the receipt usually takes a few seconds.',
        tip: 'Lay the receipt flat, fit the whole receipt in the frame, and avoid shadows.',
        image: 'scan-photo.png',
      },
      {
        title: 'Check what the app read',
        text: 'The total, sub-total and every item appear in editable boxes. Fix any wrong name or price, remove extra lines, or add a missing item. Items ordered more than once are listed one per line so each can go to a different person.',
        tip: 'The green box means the items add up to the sub-total. You can only continue once they match.',
        image: 'scan-review.png',
      },
      {
        title: 'Add the people',
        text: 'Enter how many people are splitting the bill and tap Go, then type each name. If you are signed in, tap the star to save a name as a favorite and pick it quickly next time.',
        image: 'names.png',
      },
      {
        title: 'Assign each item',
        text: 'For every item, choose who ordered it. Choose (All) to split an item equally between everyone, or (Custom) to split it between some people only. You can also add a tip here; it is divided equally.',
        image: 'scan-assign.png',
      },
      {
        title: 'See the result and share it',
        text: 'Tap Calculate. Each person gets a card with their orders, their share of tax and service, and the total to pay. Tap Share on a card to send that person their bill as an image.',
        image: 'result.png',
      },
    ],
    manualSteps: [
      {
        title: 'Add the people',
        text: 'Enter how many people are splitting the bill and tap Go, then type each name and tap Next.',
        image: 'names.png',
      },
      {
        title: 'Enter the totals and each order',
        text: 'Type the Total Receipt Value (the final amount) and the Sub-total (before tax and service). Add a discount or tip if there is one. Then, under each name, enter the price of what that person ordered. Use + to add another order and - to remove one. The item name is optional.',
        tip: 'For something shared, such as a bottle of water, divide its price and add a part to each person.',
        image: 'manual-entry.png',
      },
      {
        title: 'See the result and share it',
        text: 'When the orders add up to the sub-total, tap Calculate. Each person gets a card showing what they pay, including their share of tax and service. Tap Share to send it as an image.',
        image: 'manual-result.png',
      },
    ],
    goodToKnowTitle: 'Good to know',
    goodToKnow: [
      'Tax and service are split in proportion to what each person ordered, so whoever ordered more pays more of them.',
      'The sub-total is the amount before tax and service. The total is the final amount on the receipt.',
      'Sign in to keep a history of your past bills and a list of favorite names. Without signing in, nothing is saved.',
      'If a scan fails, try again with a clearer photo, or tap "Can\'t scan? Enter values manually".',
    ],
    startButton: 'Start splitting a bill',
    screenshotAlt: 'Screenshot',
    stepLabel: 'Step',
  },
  ar: {
    title: 'كيفية استخدام reCalc',
    intro:
      'يقسّم reCalc فاتورة المطعم أو الكافيه بعدل: كل شخص يدفع ثمن ما طلبه، مع نصيبه من الضريبة والخدمة. توجد طريقتان لذلك، اختر ما يناسبك.',
    scanTab: '📷 مسح الفاتورة',
    manualTab: '✍️ إدخال يدوي',
    startTitle: 'البداية: اختر طريقة التقسيم',
    startText:
      'في الصفحة الرئيسية، اختر «مسح الفاتورة» ليقرأ التطبيق صورة الفاتورة، أو «إدخال يدوي» لتكتب المبالغ بنفسك.',
    scanTitle: 'الطريقة الأولى: مسح الفاتورة',
    scanIntro: 'الأنسب عندما تكون الفاتورة المطبوعة أمامك. يقرأ التطبيق الأصناف والأسعار بدلاً منك.',
    manualTitle: 'الطريقة الثانية: الإدخال اليدوي',
    manualIntro: 'الأنسب عندما لا توجد فاتورة، أو تكون غير واضحة، أو تعرف مسبقًا ما على كل شخص.',
    scanSteps: [
      {
        title: 'التقط صورة أو ارفعها',
        text: 'اضغط «التقط صورة» لاستخدام الكاميرا، أو «رفع صورة» لاختيار صورة موجودة. ثم اضغط «استخراج البيانات». تستغرق قراءة الفاتورة عادةً بضع ثوانٍ.',
        tip: 'افرد الفاتورة، واجعلها كاملة داخل الصورة، وتجنّب الظلال.',
        image: 'scan-photo.png',
      },
      {
        title: 'راجع ما قرأه التطبيق',
        text: 'يظهر الإجمالي وإجمالي الطلبات وكل صنف في خانات قابلة للتعديل. صحّح أي اسم أو سعر خاطئ، واحذف السطور الزائدة، أو أضف صنفًا ناقصًا. الأصناف المطلوبة أكثر من مرة تظهر كل واحدة في سطر، حتى يمكن إسناد كل منها لشخص مختلف.',
        tip: 'المربع الأخضر يعني أن مجموع الأصناف يطابق إجمالي الطلبات. لا يمكنك المتابعة إلا بعد التطابق.',
        image: 'scan-review.png',
      },
      {
        title: 'أضف الأشخاص',
        text: 'أدخل عدد الأشخاص المشتركين في الفاتورة واضغط «ابدأ»، ثم اكتب اسم كل شخص. إذا كنت مسجلاً للدخول، اضغط النجمة لحفظ الاسم في المفضلة واختياره بسرعة في المرة القادمة.',
        image: 'names.png',
      },
      {
        title: 'وزّع الأصناف',
        text: 'اختر لكل صنف من طلبه. اختر «(الكل)» لتقسيم الصنف بالتساوي على الجميع، أو «(مخصص)» لتقسيمه على بعض الأشخاص فقط. يمكنك أيضًا إضافة إكرامية هنا، وتُقسَّم بالتساوي.',
        image: 'scan-assign.png',
      },
      {
        title: 'شاهد النتيجة وشاركها',
        text: 'اضغط «احسب». يحصل كل شخص على بطاقة فيها طلباته ونصيبه من الضريبة والخدمة والإجمالي المطلوب دفعه. اضغط «مشاركة» في أي بطاقة لإرسال حساب صاحبها كصورة.',
        image: 'result.png',
      },
    ],
    manualSteps: [
      {
        title: 'أضف الأشخاص',
        text: 'أدخل عدد الأشخاص المشتركين في الفاتورة واضغط «ابدأ»، ثم اكتب اسم كل شخص واضغط «التالي».',
        image: 'names.png',
      },
      {
        title: 'أدخل الإجماليات وطلبات كل شخص',
        text: 'اكتب إجمالي الفاتورة (المبلغ النهائي) وإجمالي الطلبات (قبل الضريبة والخدمة). أضف الخصم أو الإكرامية إن وُجدا. ثم أدخل تحت كل اسم سعر ما طلبه صاحبه. استخدم + لإضافة طلب آخر و - لحذف طلب. اسم الصنف اختياري.',
        tip: 'للأصناف المشتركة، مثل زجاجة مياه، اقسم سعرها وأضف جزءًا لكل شخص.',
        image: 'manual-entry.png',
      },
      {
        title: 'شاهد النتيجة وشاركها',
        text: 'عندما يطابق مجموع الطلبات إجمالي الطلبات، اضغط «احسب». يحصل كل شخص على بطاقة توضّح ما عليه دفعه، شاملاً نصيبه من الضريبة والخدمة. اضغط «مشاركة» لإرسالها كصورة.',
        image: 'manual-result.png',
      },
    ],
    goodToKnowTitle: 'معلومات مفيدة',
    goodToKnow: [
      'تُقسَّم الضريبة والخدمة بنسبة ما طلبه كل شخص، فمن طلب أكثر يدفع نصيبًا أكبر منهما.',
      'إجمالي الطلبات هو المبلغ قبل الضريبة والخدمة. إجمالي الفاتورة هو المبلغ النهائي المكتوب فيها.',
      'سجّل الدخول لحفظ سجل حساباتك السابقة وقائمة الأسماء المفضلة. بدون تسجيل الدخول لا يُحفظ شيء.',
      'إذا فشل المسح، حاول مرة أخرى بصورة أوضح، أو اضغط «لا يمكنك المسح؟ أدخل القيم يدويًا».',
    ],
    startButton: 'ابدأ تقسيم فاتورة',
    screenshotAlt: 'لقطة شاشة',
    stepLabel: 'الخطوة',
  },
};
