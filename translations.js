// ملف الترجمة

// تعريف الكائنات
window.translations = {
  en: {
    pageTitle: 'reCalc - Calculate Your Receipt',
    appTitle: 'Calculate Your Receipt',
    numPeople: 'Number of People:',
    numPeopleError: 'Please enter the number of people',
    totalOrder: 'Total Receipt Value:',
	  totalOrderError: 'Please enter the total order value',
    subTotal: 'Sub-total:',
	  subTotalError: 'Please enter the subtotal',
    subTotalGreaterError: 'Subtotal cannot be greater than total value!',
    negativeError: 'Negative values are not allowed',
    discountError: 'Please enter a valid discount value',
    discountGreaterError: 'Discount cannot be greater than the total order',
    noLabel: "No-Label",
    generateNamesButton: 'Go',
    nextButton: 'Next',
    backButton: 'Back',
	  saveButton: 'Save',
	  deleteButton: 'Delete',
	  changeButton: 'Change',
    calculateButton: 'Calculate',
    calculatingButton: 'Calculating…',
    resultsTitle: 'Results',
    details: "Details",
    startAgainButton: 'Start Again',
    shareResultButton: 'Share',
    order: 'Order',
    vat: 'VAT',
    totalToPay: 'Total to Pay',
    nameLabel: 'Name',
    nameError: 'Please enter a name',
    mismatchError: 'Subtotal mismatch!',
	  footerAbout: "About us",
	  footerPrivacy: "Privacy",
	  footerContact: "Contact us",
    footerBlog: "Blog",
    howToButton: 'How to use',
    footerText: 'All rights reserved © 2025',
    totalWithoutVAT: 'Total without VAT',
	  coffeeLine1: 'Enjoying the App?',
	  coffeeLine2: 'Consider buying me a coffee to support my work',
    discount: 'Discount (optional):',
	  authSignIn: 'Sign in',
    authSignUp: 'Sign up',
    authSignOut: 'Sign out',
    manage: 'Manage',
    logout: 'Logout',
    manageAccountTitle: 'Manage Account',
    changePasswordLabel: 'Change password (requires current password)',
    addFavoriteButton: 'Add favorite',
    savedToFavorites: 'Saved to favorites',
	  manageNote: 'If you are not logged in, your favorites and browsing history will be stored locally in your browser. For security reasons, changing your password requires entering your current password.',
	  authWelcome: 'Welcome, {name}',
	  manageProfileTitle: 'Profile',
	  profileDisplayName: 'Display Name',
	  manageHistoryTitle: 'Calculations History',
	  recentHistoryTitle: 'Recent History',
	  FullHistoryButton: 'View Full History',
	  manageFavoritesTitle: 'Favorites',
	  manageBackButton: 'Back',
	  FavoriteTitle: 'Favorite',
	  historyCardTitle: 'Saved',
	  authManage: 'Manage',
	  authLogout: 'Logout',
	  languageEnglish: '🌐 English',
	  languageArabic: '🌐 العربية',
    createPasswordLabel: 'Set a password (for email sign-in)',
    createButton: 'Set Password',
    currentPasswordPlaceholder: 'Current password',
    newPasswordPlaceholder: 'New password',
    setPasswordPlaceholder: 'Set a new password',
    backToManageButton: '← Back to Manage',
    deleteAllHistoryButton: 'Delete All History',
    alertConfirmDeleteAll: 'Are you sure you want to delete ALL history? This action cannot be undone.',
    alertHistoryDeleted: 'All history has been deleted.',
    alertLocalHistoryDeleted: 'All local history has been deleted.',
    alertConfirmDeleteOne: 'Are you sure you want to delete this calculation?',
    backToBlogButton: 'العودة للمدونة / Back to Blog ←',
    backToIndexButton: 'الرئيسية / Home ←',

    // --- Receipt scanning / assignment flow ---
    chooseMethodTitle: 'How would you like to split the bill?',
    scanMethodButton: '📷 Scan Receipt',
    manualMethodButton: '✍️ Enter Manually',
    scanStepTitle: 'Scan Your Receipt',
    takePhotoButton: '📷 Take Photo',
    uploadPhotoButton: '🖼️ Upload Photo',
    retakePhotoButton: 'Retake / Choose Another',
    extractButton: 'Extract Data',
    extractingMessage: 'Reading your receipt… this can take a few seconds.',
    ocrFailedError: 'Could not read the receipt automatically. Please check/enter the values below.',
    scanManualFallbackButton: "Can't scan? Enter values manually",
    scanItemsTitle: 'Items Found on Receipt',
    addItemButton: '+ Add Item',
    itemNamePlaceholder: 'Item name',
    itemPricePlaceholder: 'Price',
    continueButton: 'Continue',
    noItemsFoundMessage: 'No items detected — add them manually below.',
    assignStepTitle: 'Assign Items to Each Person',
    assignStepSubtitle: 'Choose who ordered each item. Totals are taken from your scanned receipt.',
    choosePersonPlaceholder: '-- Choose person --',
    unassignedError: 'Please assign every item to a person before calculating.',
    removeButton: 'Remove',
    backToStart: '← Back',
    cameraNotSupported: 'Camera capture is not supported on this device/browser. Please use "Upload Photo" instead.',
    itemsSumLabel: 'Items total',
    itemsMismatchError: "The items total doesn't match the Sub-Total. Please review the extracted values and items to make sure they match your receipt before continuing."
  },
  ar: {
    pageTitle: 'reCalc - احسب فاتورتك مع أصدقائك',
    appTitle: 'احسب فاتورتك مع أصدقائك',
    numPeople: 'عدد الأشخاص:',
    numPeopleError: 'يرجى إدخال عدد الأشخاص',
    totalOrder: 'إجمالي الفاتورة:',
	  totalOrderError: 'يرجى إدخال إجمالي الفاتورة',
    subTotal: 'إجمالي الطلبات (بدون ضريبة):',
  	subTotalError: 'يرجى إدخال إجمالي الطلبات',
    subTotalGreaterError: 'إجمالي الطلبات لا يمكن أن يكون أكبر من إجمالي الفاتورة!',
    negativeError: 'القيم السالبة غير مسموح بها',
    discountError: 'يرجى إدخال قيمة خصم صحيحة',
    discountGreaterError: 'الخصم لا يمكن أن يكون أكبر من إجمالي الفاتورة',
    noLabel: "بدون اسم",
    generateNamesButton: 'ابدأ',
    nextButton: 'التالي',
    backButton: 'السابق',
	  saveButton: 'حفظ',
	  deleteButton: 'مسح',
	  changeButton: 'تغيير',
    calculateButton: 'احسب',
    calculatingButton: 'جارٍ الحساب…',
    resultsTitle: 'النتائج',
    details: "التفاصيل",
    startAgainButton: 'احسب مرة اخرى',
    shareResultButton: 'مشاركة',
    order: 'الطلبات',
    vat: 'الضريبة',
    totalToPay: 'الإجمالي',
    nameLabel: 'اسم',
    nameError: 'يرجى ملء هذا الحقل',
    mismatchError: 'المجموع غير مطابق!',
	  footerAbout: "من نحن",
	  footerPrivacy: "سياسة الخصوصية",
	  footerContact: "تواصل معنا",
    footerBlog: "المدونة",
    howToButton: 'كيفية الاستخدام',
    footerText: 'جميع الحقوق محفوظة © 2025',
    totalWithoutVAT: 'الإجمالي بدون ضريبة',
	  coffeeLine1: 'عجبك التطبيق؟',
	  coffeeLine2: 'ادعمني بفنجان قهوة',
    discount: 'الخصم (اختياري):',
	  authSignIn: 'تسجيل الدخول',
    authSignUp: 'إنشاء حساب',
    authSignOut: 'تسجيل الخروج',
    manage: 'إدارة',
    logout: 'تسجيل الخروج',
    manageAccountTitle: 'إدارة الحساب',
    changePasswordLabel: 'تغيير كلمة المرور (يتطلب كلمة المرور الحالية)',
    addFavoriteButton: 'أضف للمفضلة',
    savedToFavorites: 'تم الحفظ في المفضلة',
	  manageNote: 'إذا لم تكن مسجلاً للدخول، فسيتم تخزين المفضلة وسجل التصفح محليًا في متصفحك. ولأسباب أمنية، يتطلب تغيير كلمة المرور إدخال كلمة المرور الحالية.',
	  authWelcome: 'مرحباً، {name}',
	  manageProfileTitle: 'الملف الشخصي',
	  profileDisplayName: 'الإسم',
	  manageHistoryTitle: 'سجل حساباتك',
	  recentHistoryTitle: 'سجل آخر الحسابات',
	  FullHistoryButton: 'عرض السجل الكامل',
	  manageFavoritesTitle: 'المفضلات',
	  manageBackButton: 'عودة',
	  FavoriteTitle: 'تفضيل',
	  historyCardTitle: 'محفوظ',
	  authManage: 'إدارة',
	  authLogout: 'تسجيل الخروج',
	  languageEnglish: '🌐 English',
	  languageArabic: '🌐 العربية',
    createPasswordLabel: 'إنشاء كلمة مرور ',
    createButton: 'إنشاء',
    currentPasswordPlaceholder: 'كلمة المرور الحالية',
    newPasswordPlaceholder: 'كلمة المرور الجديدة',
    setPasswordPlaceholder: 'عيّن كلمة مرور جديدة',
    backToManageButton: '← العودة لإدارة حسابك',
    deleteAllHistoryButton: 'حذف كل السجل',
    alertConfirmDeleteAll: 'هل أنت متأكد أنك تريد حذف كل السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    alertHistoryDeleted: 'تم حذف كل السجل.',
    alertLocalHistoryDeleted: 'تم حذف كل السجل المحلي.',
    alertConfirmDeleteOne: 'هل أنت متأكد أنك تريد حذف هذه العملية الحسابية؟',
    backToBlogButton: 'العودة للمدونة / Back to Blog ←',
    backToIndexButton: 'الرئيسية / Home ←',

    // --- خطوات مسح الفاتورة وتوزيع الأصناف ---
    chooseMethodTitle: 'كيف تريد تقسيم الفاتورة؟',
    scanMethodButton: '📷 مسح الفاتورة',
    manualMethodButton: '✍️ إدخال يدوي',
    scanStepTitle: 'امسح فاتورتك',
    takePhotoButton: '📷 التقط صورة',
    uploadPhotoButton: '🖼️ رفع صورة',
    retakePhotoButton: 'إعادة الالتقاط / اختيار صورة أخرى',
    extractButton: 'استخراج البيانات',
    extractingMessage: 'جاري قراءة الفاتورة… قد يستغرق ذلك بضع ثوانٍ.',
    ocrFailedError: 'تعذّرت قراءة الفاتورة تلقائيًا. يرجى التحقق من القيم أدناه أو إدخالها يدويًا.',
    scanManualFallbackButton: 'لا يمكنك المسح؟ أدخل القيم يدويًا',
    scanItemsTitle: 'الأصناف الموجودة في الفاتورة',
    addItemButton: '+ إضافة صنف',
    itemNamePlaceholder: 'اسم الصنف',
    itemPricePlaceholder: 'السعر',
    continueButton: 'متابعة',
    noItemsFoundMessage: 'لم يتم العثور على أصناف — أضفها يدويًا أدناه.',
    assignStepTitle: 'وزّع الأصناف على كل شخص',
    assignStepSubtitle: 'اختر من طلب كل صنف. الإجماليات مأخوذة من فاتورتك الممسوحة.',
    choosePersonPlaceholder: '-- اختر شخصًا --',
    unassignedError: 'يرجى تعيين كل صنف لشخص قبل الحساب.',
    removeButton: 'حذف',
    backToStart: '← رجوع',
    cameraNotSupported: 'التقاط الصور بالكاميرا غير مدعوم على هذا الجهاز/المتصفح. يرجى استخدام "رفع صورة" بدلاً من ذلك.',
    itemsSumLabel: 'إجمالي الأصناف',
    itemsMismatchError: 'إجمالي الأصناف لا يطابق (المجموع الفرعي). يرجى مراجعة القيم والأصناف المستخرجة والتأكد من مطابقتها لفاتورتك قبل المتابعة.'
  }
};

window.currentLanguage = 'en';

// defensive setLanguage implementation
window.setLanguage = function (lang) {
  try {
    window.currentLanguage = lang;
    const t = translations[lang] || translations['en'];

    // safe setter helper
    function setIfExists(idOrEl, value) {
      if (!idOrEl) return;
      let el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
      if (el) el.innerText = value;
    }

    setIfExists('app-title', t.appTitle);
    setIfExists('label-num-people', t.numPeople);
    setIfExists('label-total-order', t.totalOrder);
    setIfExists('label-sub-total', t.subTotal);
    setIfExists('label-discount', t.discount);
    setIfExists('generate-names-button', t.generateNamesButton);
    setIfExists('next-button', t.nextButton);
    setIfExists('back-to-step1-button', t.backButton);
    setIfExists('back-to-step3-button', t.backButton);
	  setIfExists('save-button', t.saveButton);
	  setIfExists('delete-button', t.deleteButton);
	  setIfExists('change-button', t.changeButton);
    setIfExists('calculate-button', t.calculateButton);
    setIfExists('results-title', t.resultsTitle);
    setIfExists('start-again-button', t.startAgainButton);
    setIfExists('share-result-button', t.shareResultButton);
    setIfExists('footer-link-about', t.footerAbout);
    setIfExists('footer-link-privacy', t.footerPrivacy);
    setIfExists('footer-link-contact', t.footerContact);
    setIfExists('footer-link-blog', t.footerBlog);
    setIfExists('footer-text', t.footerText);
    setIfExists('howto-button', t.howToButton);
    setIfExists('manage-button', t.manage);
    setIfExists('logout-button', t.logout);
    setIfExists('manage-account-title', t.manageAccountTitle);
    setIfExists('change-password-label', t.changePasswordLabel);
    setIfExists('add-favorite-button', t.addFavoriteButton);
	  setIfExists('save-favorite-button', t.savedToFavorites);
	  setIfExists('manage-note', t.manageNote);
	  setIfExists('auth-title', t.authWelcome);
	  setIfExists('manage-profile-title', t.manageProfileTitle);
	  setIfExists('manage-displayname', t.profileDisplayName);
	  setIfExists('manage-history-title', t.manageHistoryTitle);
	  setIfExists('recent-history-title', t.recentHistoryTitle);
	  setIfExists('view-full-history-btn', t.FullHistoryButton);
	  setIfExists('manage-favorites-title', t.manageFavoritesTitle);
	  setIfExists('manage-back-btn', t.manageBackButton);
	  setIfExists('Favorite-Title', t.FavoriteTitle);
	  setIfExists('auth-manage-button', t.authManage);
	  setIfExists('auth-logout-button', t.authLogout);
	  setIfExists('languageEnglish', t.languageEnglish);
	  setIfExists('languageArabic', t.languageArabic);
    setIfExists('back-to-manage-btn', t.backToManageButton);
    setIfExists('delete-all-btn', t.deleteAllHistoryButton);
    setIfExists('back-to-blog-btn', t.backToBlogButton);
    setIfExists('back-to-index-btn', t.backToIndexButton);

    // --- Receipt scanning / assignment flow ---
    setIfExists('step0-title', t.chooseMethodTitle);
    setIfExists('choose-scan-button', t.scanMethodButton);
    setIfExists('choose-manual-button', t.manualMethodButton);
    setIfExists('scan-step-title', t.scanStepTitle);
    setIfExists('scan-camera-button', t.takePhotoButton);
    setIfExists('scan-upload-button', t.uploadPhotoButton);
    setIfExists('scan-retake-button', t.retakePhotoButton);
    setIfExists('scan-extract-button', t.extractButton);
    setIfExists('scan-loading', t.extractingMessage);
    setIfExists('scan-manual-fallback-button', t.scanManualFallbackButton);
    setIfExists('scan-items-title', t.scanItemsTitle);
    setIfExists('scan-add-item-button', t.addItemButton);
    setIfExists('scan-continue-button', t.continueButton);
    setIfExists('scan-back-button', t.backToStart);
    setIfExists('scan-label-total-order', t.totalOrder);
    setIfExists('scan-label-sub-total', t.subTotal);
    setIfExists('scan-label-discount', t.discount);
    setIfExists('back-to-step0-button', t.backToStart);
    setIfExists('assign-step-title', t.assignStepTitle);
    setIfExists('assign-step-subtitle', t.assignStepSubtitle);
    setIfExists('assign-label-total-order', t.totalOrder);
    setIfExists('assign-label-sub-total', t.subTotal);
    setIfExists('assign-label-discount', t.discount);
    setIfExists('assign-add-item-button', t.addItemButton);
    setIfExists('assign-back-button', t.backButton);
    setIfExists('assign-calculate-button', t.calculateButton);
    document.querySelectorAll('.scan-item-remove, .assign-item-remove').forEach(btn => btn.innerText = t.removeButton);
    document.querySelectorAll('.assign-person-select option[value=""]').forEach(opt => opt.innerText = t.choosePersonPlaceholder);
    document.querySelectorAll('.item-name-input').forEach(inp => inp.placeholder = t.itemNamePlaceholder);
    document.querySelectorAll('.item-price-input').forEach(inp => inp.placeholder = t.itemPricePlaceholder);
    if (typeof window.updateScanItemsSum === 'function') window.updateScanItemsSum();

    // auth modal / auth button
    const authBtn = document.getElementById('auth-button');
    if (authBtn) authBtn.innerText = t.authSignIn;

    const authModalTitle = document.getElementById('auth-modal-title');
    if (authModalTitle) authModalTitle.innerText = t.authSignIn;

    const authActionBtn = document.getElementById('auth-action-button');
    if (authActionBtn) authActionBtn.innerText = t.authSignIn;

    const authSwitchMsg = document.getElementById('auth-switch-message');
    if (authSwitchMsg) {
      // Keep existing behavior, but use translated labels
      authSwitchMsg.innerHTML = `${t.authSignIn} / <a href="#" onclick="switchAuthMode('signup'); return false;">${t.authSignUp}</a>`;
    }

    // language toggle text
    const langButton = document.querySelector('.lang-link');
    if (langButton) {
      langButton.innerText = lang === 'ar' ? '🌐 English' : '🌐 العربية';
    }

    // dynamic per-name labels (for currently generated inputs)
    document.querySelectorAll('#names-form label').forEach((label, i) => {
      label.innerText = `${t.nameLabel} ${i + 1}`;
    });

    // update cards and totals if present
    document.querySelectorAll('#cards-container .card').forEach(card => {
      const spans = card.querySelectorAll('.card-content span');
      spans.forEach((span, i) => {
        span.innerText = `${t.order} ${i + 1}:`;
      });
    });

    // Update result cards reliably: order, vat, discount, total
    document.querySelectorAll('#result-cards-container .card').forEach(card => {
      try {
    const contents = Array.from(card.querySelectorAll('.card-content'));
    // find total element (has special class)
    const totalEl = card.querySelector('.total-to-pay') || contents[contents.length - 1] || null;
    const orderEl = contents[0] || null;
    const vatEl = contents[1] || null;

      const detailsLabel = card.querySelector('.card-details .details-label');
      if (detailsLabel) {
        detailsLabel.innerText = t.details || translations['en'].details || 'Details';
      }


    // discount may be the 3rd content, but ensure it's not the total
    let discountEl = null;
    if (contents.length >= 3) {
      const candidate = contents[2];
      if (candidate && !candidate.classList.contains('total-to-pay')) discountEl = candidate;
    }

    const getValueText = (el) => {
      if (!el) return '';
      // preserve whatever comes after the first colon (the numeric part or whatever)
      return el.innerText.split(':').slice(1).join(':').trim();
    };

    if (orderEl) {
      const orderVal = getValueText(orderEl);
      orderEl.innerHTML = `${t.order}: ${orderVal}`;
    }
    if (vatEl) {
      const vatVal = getValueText(vatEl);
      vatEl.innerHTML = `${t.vat}: ${vatVal}`;
    }
    if (discountEl) {
      const discountVal = getValueText(discountEl);
      // keep translation for discount (remove parenthesis note as before)
      discountEl.innerHTML = `${t.discount.replace(/\s*\(.*\)/, '')} ${discountVal}`;
    }
    if (totalEl) {
      const totalVal = getValueText(totalEl);
      // ensure total shows with the strong wrapper (same as current UI)
      totalEl.innerHTML = `<strong>${t.totalToPay}: ${totalVal}</strong>`;
    }
      } catch (e) {
    // safe fallback — don't break language switch if a card structure is unexpected
    console.warn('setLanguage: result card update failed', e);
     }
  });


    document.querySelectorAll('.person-subtotal-label').forEach(span => {
      const value = span.innerText.split(':').slice(1).join(':').trim();
      span.innerText = `${t.totalWithoutVAT}: ${value}`;
    });

    // --- simple: reload manage/history pages after language change (safe guard to avoid reload loops) ---
(function () {
  try {
    // Only reload when switching language on manage.html or history.html
    const path = (window.location.pathname || '').toLowerCase();
    const isManage = path.endsWith('manage.html') || path.includes('/manage');
    const isHistory = path.endsWith('history.html') || path.includes('/history');

    if (isManage || isHistory) {
      // prevent an infinite reload loop: only reload if we haven't already reloaded for this language
      const lastReloadForLang = sessionStorage.getItem('reloaded_for_lang') || '';
      if (lastReloadForLang !== lang) {
        sessionStorage.setItem('reloaded_for_lang', lang);
        // tiny delay so UI updates (lang button) are visible briefly before reload
        setTimeout(() => { window.location.reload(); }, 50);
      }
    } else {
      // clear the flag on other pages so future switches on manage/history will reload again
      sessionStorage.removeItem('reloaded_for_lang');
    }
  } catch (e) {
    // swallow errors — do not break the rest of setLanguage
    console.warn('language reload guard error', e);
  }
})();

    // page title
    if (t.pageTitle) document.title = t.pageTitle;
  } catch (err) {
    console.error('setLanguage error', err);
  }
};



