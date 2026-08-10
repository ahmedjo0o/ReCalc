let hideDropdownTimeoutId = null;
window.addEventListener('DOMContentLoaded', () => {
  
  lottie.loadAnimation({
    container: document.querySelector('.loader-lottie'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'loading.json'
  });
});

window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    const elapsed = Date.now() - (window.startTime || Date.now());
    const minimumDelay = 1000;

    const remainingTime = Math.max(minimumDelay - elapsed, 0);
    
        setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => {
       loader.remove();
     }, 400);
    }, remainingTime);
  }
  
  const savedLang = localStorage.getItem('preferredLanguage');
  window.currentLanguage = savedLang || window.currentLanguage;
  setLanguage(currentLanguage);
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
});


window.toggleLanguage = function () {
  const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
  localStorage.setItem('preferredLanguage', newLang);
  setLanguage(newLang);
  document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
};

// ... (Auth functions 'openAuthModal' through 'updateAuthUI' are unchanged) ...
window.openAuthModal = function (mode = 'signin') {
  window.authModalMode = mode; // 'signin' or 'signup'
  const modal = document.getElementById('auth-modal');
  const title = document.getElementById('auth-modal-title');
  const actionBtn = document.getElementById('auth-action-button');
  const switchMsg = document.getElementById('auth-switch-message');
  const pwd = document.getElementById('auth-password');
  const email = document.getElementById('auth-email');

  // set autocomplete hints
  email.autocomplete = 'username';
  if (mode === 'signup') {
    pwd.autocomplete = 'new-password';
  } else {
    pwd.autocomplete = 'current-password';
  }

  // set modal UI for mode
  if (mode === 'signup') {
    title.innerText = 'Sign up';
    actionBtn.innerText = 'Create account';
    actionBtn.onclick = authRegister;
    switchMsg.innerHTML = 'Already have an account? <a href="#" onclick="switchAuthMode(\'signin\'); return false;">Sign in</a>';
  } else {
    title.innerText = 'Sign in';
    actionBtn.innerText = 'Sign in';
    actionBtn.onclick = authLogin;
    switchMsg.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchAuthMode(\'signup\'); return false;">Sign up</a>';
  }

  // clear inputs
  email.value = '';
  pwd.value = '';

  modal.style.display = 'flex';
};

window.closeAuthModal = function () {
  document.getElementById('auth-modal').style.display = 'none';
};

// Allow closing auth modal by clicking outside the box
document.addEventListener('mousedown', (event) => {
  const modal = document.getElementById('auth-modal');
  const content = document.querySelector('.auth-modal-content');
  if (modal && modal.style.display === 'flex' && content && !content.contains(event.target)) {
    closeAuthModal();
  }
});


window.switchAuthMode = function(mode) {
  openAuthModal(mode);
};

// Improved registration with inline validation and UI feedback
window.authRegister = async function () {
  const emailEl = document.getElementById('auth-email');
  const pwdEl = document.getElementById('auth-password');
  const email = emailEl.value.trim();
  const pw = pwdEl.value.trim();
  if (!email || !pw) {
    alert('Please enter email and password.');
    return;
  }
  try {
    const user = await authCreateAccount(email, pw);
    closeAuthModal();
    updateAuthUI(user);
    console.log('Registered:', user.email);
  } catch (err) {
    console.error('Registration error', err);
    alert('Registration failed: ' + (err.message || err));
  }
};

window.authLogin = async function () {
  const emailEl = document.getElementById('auth-email');
  const pwdEl = document.getElementById('auth-password');
  const email = emailEl.value.trim();
  const pw = pwdEl.value.trim();
  if (!email || !pw) {
    alert('Please enter email and password.');
    return;
  }
  try {
    const user = await authSignIn(email, pw);
    closeAuthModal();
    updateAuthUI(user);
    console.log('Signed in:', user.email);
  } catch (err) {
    console.error('Login error', err);
    alert('Sign in failed: ' + (err.message || err));
  }
};

// Google sign-in UI wrapper remains but show helpful message
window.authSignInWithGoogleUI = async function () {
  try {
    const user = await authSignInWithGoogle();
    console.log('Google sign-in:', user.email);
    closeAuthModal();
    updateAuthUI(user);
  } catch (err) {
    console.error('Google sign-in error', err);
    // if unauthorized domain or other oauth errors, give clear guidance
    if (err && err.code === 'auth/unauthorized-domain') {
      alert('Google sign-in failed: your domain is not authorized for OAuth. Add your Netlify domain to Firebase Console → Authentication → Authorized domains.');
    } else {
      alert('Google sign-in failed: ' + (err.message || err));
    }
  }
};

window.authLogout = async function () {
  try {
    await authSignOut();
    window.location.reload(); // Reload after logout
  } catch (err) {
    console.error(err);
    alert('Logout failed: ' + (err.message || err));
  }
};



window.updateAuthUI = function (user) {
  const ui = document.getElementById('user-info');
  const authBtn = document.getElementById('auth-button');
  const controls = document.getElementById('auth-controls');
  const manageBtn = document.getElementById('manage-button');
  const authArea = document.querySelector('.auth-area');

  const t = translations[currentLanguage] || translations['en'];
  const signInText = t.authSignIn || 'Sign in';
  const logoutText = t.authLogout || 'Logout';
  const manageText = t.authManage || 'Manage';
  const welcomeTemplate = t.authWelcome || 'Welcome, {name}';

  if (manageBtn) manageBtn.innerText = manageText;

  if (user) {
    // logged in — show the Manage button and auth box
    authArea.classList.add('logged-in');
    if (manageBtn) manageBtn.style.display = 'inline-block';

    const display = user.displayName || user.email || (user.uid ? user.uid.slice(0, 8) : '');
    const welcome = welcomeTemplate.replace('{name}', display);

    if (ui) ui.innerText = welcome;
    if (controls) controls.style.display = 'flex';
    if (authBtn) authBtn.style.display = 'none';
  } else {
    // logged out — hide Manage button and remove box style
    authArea.classList.remove('logged-in');
    if (manageBtn) manageBtn.style.display = 'none';

    if (ui) ui.innerText = '';
    if (controls) controls.style.display = 'none';
    if (authBtn) {
      authBtn.style.display = 'inline-block';
      authBtn.innerText = signInText;
      authBtn.onclick = () => openAuthModal('signin');
    }
  }
};

// Hook auth state
onAuthStateChanged((user) => {
  window.currentUser = user;
  updateAuthUI(user);
});


function showSection(currentId, nextId) {
  const current = document.getElementById(currentId);
  const next = document.getElementById(nextId);

  if (current) {
    current.classList.remove('fade-slide-in');
    current.classList.add('fade-slide-out');

    setTimeout(() => {
      current.style.display = 'none';
      current.classList.remove('fade-slide-out');

      next.style.display = 'block';
      next.classList.add('fade-slide-in');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 250);
  }
}


window.generateNames = async function () {
  const count = Number(document.getElementById('num-people').value);
  const container = document.getElementById('names-form');
  container.innerHTML = ''; 
  
  if (!count || count < 1) {
    showError('num-people-error', translations[currentLanguage].numPeopleError);
    return;
  }

  const headerRow = document.createElement('div');
  headerRow.style.display = 'flex';
  headerRow.style.alignItems = 'center'; 
  headerRow.style.gap = '6px';
  headerRow.style.marginBottom = '4px';
  const labelSpacer = document.createElement('div');
  labelSpacer.style.minWidth = '90px'; 
  headerRow.appendChild(labelSpacer);
  const inputSpacer = document.createElement('div');
  inputSpacer.style.flex = '1';
  headerRow.appendChild(inputSpacer);
  const favHeaderLabel = document.createElement('span');
  favHeaderLabel.id = 'Favorite-Title';
  favHeaderLabel.innerText = translations[currentLanguage].FavoriteTitle; 
  favHeaderLabel.style.fontSize = '10px';
  favHeaderLabel.style.color = '#002e5b';
  favHeaderLabel.style.fontWeight = '600';
  favHeaderLabel.style.width = '42px'; 
  favHeaderLabel.style.textAlign = 'center'; 
  headerRow.appendChild(favHeaderLabel);
  container.appendChild(headerRow);

  const uid = window.currentUser ? window.currentUser.uid : null;
  const favs = await loadFavoritesForUI(uid); 
  const nameToId = {};
  (favs || []).forEach(f => {
    const key = (f.name || '').trim().toLowerCase();
    if (key) nameToId[key] = f.id || f.name; 
  });

  for (let i = 1; i <= count; i++) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '6px';
    wrapper.classList.add('fade-slide-in');

    const label = document.createElement('label');
    label.innerText = `${translations[currentLanguage].nameLabel} ${i}`;
    label.style.minWidth = '90px';
	label.style.marginTop = '0';

    const input = document.createElement('input');
    input.classList.add('person-name', 'fade-slide-in');
    input.type = 'text';
    input.required = true;
    input.autocomplete = 'off';
	input.style.marginTop = '0';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-fav-mini';
    addBtn.title = 'Add/remove favorite';
    addBtn.innerText = '☆';

    const updateButtonState = () => {
      const val = (input.value || '').trim().toLowerCase();
      if (!val) {
        addBtn.classList.remove('saved');
        addBtn.innerText = '☆';
        return;
      }
      if (nameToId[val]) {
        addBtn.classList.add('saved');
        addBtn.innerText = '★';
      } else {
        addBtn.classList.remove('saved');
        addBtn.innerText = '☆';
      }
    };

    addBtn.onclick = async () => {
      const nameRaw = input.value || '';
      const name = nameRaw.trim();
      if (!name) {
        showError('person-names-error', translations[currentLanguage].nameError);
        return;
      }
      const lower = name.toLowerCase();

      try {
        if (nameToId[lower]) {
          const favId = nameToId[lower];
          if (uid) {
            await deleteFavorite(uid, favId);
          } else {
            localDeleteFavorite(name);
          }
          delete nameToId[lower];
          addBtn.classList.remove('saved');
          addBtn.innerText = '☆';
        } else {
          if (uid) {
            const res = await addFavorite(uid, { name });
            if (res && res.id) nameToId[lower] = res.id;
            else nameToId[lower] = name; // fallback
          } else {
            localToggleFavorite({ name });
            nameToId[lower] = name; // local id = name
          }
          addBtn.classList.add('saved');
          addBtn.innerText = '★';
        }
        // refresh global favorites list
        const refreshed = await loadFavoritesForUI(uid);
        // rebuild nameToId from refreshed list
        Object.keys(nameToId).forEach(k => delete nameToId[k]);
        (refreshed || []).forEach(f => {
          const key = (f.name || '').trim().toLowerCase();
          if (key) nameToId[key] = f.id || f.name;
        });
        
      } catch (err) {
        console.error('toggle favorite error', err);
        alert('Could not toggle favorite: ' + (err.message || err));
      }
    };

    // Event listeners now handle the hide/show timeout ---
    
    input.removeAttribute('list');
    
    input.addEventListener('focus', () => {
        clearTimeout(hideDropdownTimeoutId);

        if (!window.availableFavorites) {
            loadFavoritesForUI(window.currentUser ? window.currentUser.uid : null)
                .then(() => showFavoritesDropdownForInput(input));
        } else {
            showFavoritesDropdownForInput(input);
        }
    });

    input.addEventListener('input', () => {
        showFavoritesDropdownForInput(input); // Show/filter list
        updateButtonState(); // Update star
    });
    
    input.addEventListener('change', () => { // For autocomplete/paste
        updateButtonState();
    });

    input.addEventListener('blur', () => {
        clearTimeout(hideDropdownTimeoutId); // Clear any previous ones first
        hideDropdownTimeoutId = setTimeout(hideFavoritesDropdown, 200); 
        updateButtonState(); // Update star
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input); 
    wrapper.appendChild(addBtn);
    container.appendChild(wrapper);
  }

  document.getElementById('next-button').style.display = 'inline-block';
};


document.getElementById('num-people').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    window.generateNames();
  }
});

window.goToStep2FromStep1 = function () {
  const names = document.querySelectorAll('.person-name');
  const valid = [...names].every(input => input.value.trim());

  if (!valid) {
	  showError('person-names-error', translations[currentLanguage].nameError);
	  return;
  }

  generateOrderCards();
  showSection('step1', 'step2and3');
}

window.goToStep2 = function () {
  showSection('result', 'step2and3');
}

window.goBackToStep1 = function () {
  showSection('step2and3', 'step1');
};

window.startAgain = function () {
  const message = currentLanguage === 'ar' ? 'البدء من جديد؟' : 'Start again?';
  if (confirm(message)) location.reload();
};

window.showError = function (elementId, message) {
    const errorMessage = document.getElementById(elementId);
    errorMessage.innerText = message;
    errorMessage.style.display = 'block';
    requestAnimationFrame(() => {
        errorMessage.style.opacity = '1';
        errorMessage.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        errorMessage.style.opacity = '0';
        errorMessage.style.transform = 'translateY(-5px)';
        setTimeout(() => errorMessage.style.display = 'none', 300);
    }, 3000);
}


window.saveNamesAsFavorites = async function () {
  const names = [...document.querySelectorAll('.person-name')].map(i => i.value.trim()).filter(Boolean);
  if (!names.length) {
    showError('person-names-error', translations[currentLanguage].nameError);
    return;
  }

  if (window.currentUser && window.currentUser.uid) {
    try {
      // save each name individually (skip duplicates on client side)
      for (const name of names) {
        await toggleFavorite(window.currentUser.uid, { name });
      }
      alert('Saved names to favorites.');
      loadFavoritesForUI(window.currentUser.uid);
    } catch (err) {
      console.error(err);
      alert('Could not save names: ' + err.message);
    }
  } else {
    // local fallback
    names.forEach(n => localToggleFavorite({ name: n }));
    alert('Saved names locally.');
    loadFavoritesForUI(null);
  }
};

/* ---------- Custom dropdown to replace datalist (cross-browser) ---------- */

async function loadFavoritesForUI(uid) {
  let favs = [];
  try {
    if (uid && typeof getFavorites === 'function') favs = await getFavorites(uid);
    else if (typeof localGetFavorites === 'function') favs = localGetFavorites();
  } catch (err) {
    console.warn('fav load', err);
    if (typeof localGetFavorites === 'function') favs = localGetFavorites();
  }
  // Normalize to array of { name, id? } or plain strings
  favs = (favs || []).map(f => (typeof f === 'string' ? { name: f } : f));
  window.availableFavorites = favs; // Set global variable
  return favs;
}


function getOrCreateFavoritesDropdown() {
  let dd = document.getElementById('favorites-dropdown');
  if (!dd) {
    dd = document.createElement('div');
    dd.id = 'favorites-dropdown';
    dd.className = 'custom-datalist';
    dd.style.position = 'absolute';
    dd.style.display = 'none';
    document.body.appendChild(dd);
  }
  return dd;
}

function showFavoritesDropdownForInput(input) {
  const dd = getOrCreateFavoritesDropdown();
  const allFavs = (window.availableFavorites || []).map(f => (f && (f.name || f)) || '').filter(Boolean);

  const selected = Array.from(document.querySelectorAll('.person-name'))
    .map(i => (i.value || '').trim().toLowerCase())
    .filter(Boolean);

  const filterQuery = (input.value || '').trim().toLowerCase();

  const items = allFavs
    .filter(n => !selected.includes(n.trim().toLowerCase()) || n.trim().toLowerCase() === (input.value||'').trim().toLowerCase())
    .filter(n => !filterQuery || n.toLowerCase().includes(filterQuery));

  dd.innerHTML = '';
  if (!items || items.length === 0) {
    dd.style.display = 'none';
    return;
  } else {
    items.forEach((name) => {
      const row = document.createElement('div');
      row.className = 'item';
      row.tabIndex = -1; 
      row.innerText = name;
      row.dataset.value = name;
      row.addEventListener('mousedown', (ev) => {
        clearTimeout(hideDropdownTimeoutId);
        ev.preventDefault(); 
        input.value = name;
        input.dispatchEvent(new Event('input', { bubbles: true })); 
        input.dispatchEvent(new Event('change', { bubbles: true })); 
        hideFavoritesDropdown();
      });
      dd.appendChild(row);
    });
  }

  // position under input
  const rect = input.getBoundingClientRect();
  const ddWidth = Math.max(rect.width, 180);
  dd.style.minWidth = rect.width + 'px';
  const scrollY = window.scrollY || window.pageYOffset;
  const top = rect.bottom + scrollY + 8; // 8px gap
  let left = rect.left + (window.scrollX || window.pageXOffset);
  const rightSide = left + ddWidth;
  const viewportW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  if (rightSide > viewportW - 12) left = Math.max(12, viewportW - ddWidth - 12);

  dd.style.left = left + 'px';
  dd.style.top = top + 'px';
  dd.style.display = 'block';
  requestAnimationFrame(() => dd.classList.add('open'));

  attachDropdownKeyboardHandlers(dd, input);
}

function hideFavoritesDropdown() {
  const dd = document.getElementById('favorites-dropdown');
  if (!dd) return;
  dd.classList.remove('open');
  setTimeout(() => {
    dd.style.display = 'none';
    dd.innerHTML = '';
  }, 160);
}

function attachDropdownKeyboardHandlers(dd, input) {
  if (dd._keyboardListener) {
    document.removeEventListener('keydown', dd._keyboardListener);
    dd._keyboardListener = null;
  }

  const KEY = { DOWN: 40, UP: 38, ENTER: 13, ESC: 27, TAB: 9 };
  let idx = -1;

  function updateActive() {
    const rows = Array.from(dd.querySelectorAll('.item'));
    rows.forEach((r, i) => r.classList.toggle('active', i === idx));
    const active = rows[idx];
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  dd._keyboardListener = function (e) {
    if (dd.style.display === 'none') return;

    if (e.keyCode === KEY.DOWN) {
      e.preventDefault();
      const rows = dd.querySelectorAll('.item');
      if (!rows.length) return;
      idx = Math.min((rows.length - 1), idx + 1);
      updateActive();
    } else if (e.keyCode === KEY.UP) {
      e.preventDefault();
      const rows = dd.querySelectorAll('.item');
      if (!rows.length) return;
      idx = Math.max(0, idx - 1);
      updateActive();
    } else if (e.keyCode === KEY.ENTER) {
      if (idx >= 0) {
        e.preventDefault();
        const rows = dd.querySelectorAll('.item');
        const sel = rows[idx];
        if (sel) {
          const v = sel.dataset.value;
          input.value = v;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true })); // Also trigger change
          hideFavoritesDropdown();
        }
      }
    } else if (e.keyCode === KEY.ESC || e.keyCode === KEY.TAB) {
      clearTimeout(hideDropdownTimeoutId);
      hideFavoritesDropdown();
    }
  };

  document.addEventListener('keydown', dd._keyboardListener);
}


window.showHistory = async function() {
  const modal = document.getElementById('history-modal');
  const content = document.getElementById('history-modal-content');
  content.innerHTML = '<div>Loading...</div>';
  modal.style.display = 'flex';
  try {
    let data = [];
    if (window.currentUser && window.currentUser.uid) {
      data = await getUserHistory(window.currentUser.uid, 50);
    } else {
      data = localGetHistory();
    }

    if (!data || data.length === 0) {
      content.innerHTML = '<div>No history found.</div>';
      return;
    }

    const html = data.map(d => {
      // handle Firestore Timestamp OR ISO string
      let when = '';
      if (d.createdAt && typeof d.createdAt.toDate === 'function') {
        when = d.createdAt.toDate().toLocaleString();
      } else {
        when = d.createdAt || '';
      }

      const itemsHtml = (d.totals || []).map(t => {
        // build breakdown from items if present
        let breakdown = '';
        if (t.items && Array.isArray(t.items) && t.items.length) {
          breakdown = '<div style="margin-top:6px; font-size:13px;">' + t.items.map(i => {
            const label = i.label ? escapeHtml(i.label) : 'No-Label';
            return `<div>${label}: ${Number(i.price || i.value || 0).toFixed(2)}</div>`;
          }).join('') + '</div>';

        }
        return `<div style="font-size:13px; margin-bottom:6px;">
                  <strong>${escapeHtml(t.name || '')}:</strong> ${Number(t.sum || 0).toFixed(2)}
                  ${breakdown}
                </div>`;
      }).join('');

      return `<div class="card" style="margin-bottom:10px;">
          <div class="card-header">Saved — ${when}</div>
          <div class.card-content">Total order: ${Number(d.totalOrder || 0).toFixed(2)}</div>
          <div style="margin-top:6px;">${itemsHtml}</div>
        </div>`;
    }).join('');
    content.innerHTML = html;
  } catch (err) {
    content.innerText = 'Error loading history: ' + err.message;
  }
};


window.closeHistoryModal = function () {
  document.getElementById('history-modal').style.display = 'none';
};