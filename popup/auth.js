(() => {
  'use strict';

  const config = window.MGEMZ_SUPABASE_CONFIG;
  const sdk = window.supabase;

  if (!config?.url || !config?.publishableKey || !sdk?.createClient) {
    document.addEventListener('DOMContentLoaded', () => {
      const message = document.getElementById('auth-message');
      if (message) {
        message.textContent = 'Supabase configuration could not be loaded.';
        message.className = 'auth-message error';
      }
    });
    return;
  }

  const client = sdk.createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });

  window.mgemzSupabase = client;

  document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const gate = document.getElementById('auth-gate');
    const form = document.getElementById('auth-form');
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-password');
    const submitButton = document.getElementById('auth-submit');
    const message = document.getElementById('auth-message');
    const signinTab = document.getElementById('auth-signin-tab');
    const signupTab = document.getElementById('auth-signup-tab');
    const demoButton = document.getElementById('auth-demo');
    const userPanel = document.getElementById('auth-user');
    const userEmail = document.getElementById('auth-user-email');
    const signoutButton = document.getElementById('auth-signout');
    let mode = 'signin';
    let demoMode = localStorage.getItem('mgemz_demo_access') === 'true';

    function setMessage(text = '', type = '') {
      message.textContent = text;
      message.className = `auth-message${type ? ` ${type}` : ''}`;
    }

    function setBusy(busy) {
      emailInput.disabled = busy;
      passwordInput.disabled = busy;
      signinTab.disabled = busy;
      signupTab.disabled = busy;
      demoButton.disabled = busy;
      submitButton.disabled = busy;
      submitButton.textContent = busy
        ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
        : (mode === 'signin' ? 'Sign in' : 'Create account');
    }

    function setMode(nextMode) {
      mode = nextMode;
      const signingIn = mode === 'signin';
      signinTab.classList.toggle('active', signingIn);
      signupTab.classList.toggle('active', !signingIn);
      signinTab.setAttribute('aria-selected', String(signingIn));
      signupTab.setAttribute('aria-selected', String(!signingIn));
      passwordInput.autocomplete = signingIn ? 'current-password' : 'new-password';
      submitButton.textContent = signingIn ? 'Sign in' : 'Create account';
      setMessage();
    }

    function applySession(session, isDemo = false) {
      demoMode = isDemo;
      const hasAccess = Boolean(session?.user) || isDemo;
      gate.classList.toggle('hidden', hasAccess);
      userPanel.classList.toggle('hidden', !hasAccess);
      userEmail.textContent = isDemo
        ? 'Free demo · Local data'
        : (session?.user?.email || '');
      signoutButton.textContent = isDemo ? 'Exit demo' : 'Sign out';
      body.classList.toggle('auth-pending', !hasAccess);
      window.dispatchEvent(new CustomEvent('mgemz:auth-changed', {
        detail: { session: session || null, isDemo }
      }));
    }

    signinTab.addEventListener('click', () => setMode('signin'));
    signupTab.addEventListener('click', () => setMode('signup'));
    demoButton.addEventListener('click', () => {
      localStorage.setItem('mgemz_demo_access', 'true');
      setMessage();
      applySession(null, true);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage();
      setBusy(true);

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      try {
        const result = mode === 'signin'
          ? await client.auth.signInWithPassword({ email, password })
          : await client.auth.signUp({ email, password });

        if (result.error) throw result.error;

        if (mode === 'signup' && !result.data.session) {
          setMode('signin');
          emailInput.value = email;
          setMessage('Account created. Check your email to confirm it, then sign in.', 'success');
          return;
        }

        localStorage.removeItem('mgemz_demo_access');
        applySession(result.data.session);
        form.reset();
      } catch (error) {
        console.error('Supabase authentication failed:', error);
        setMessage(error?.message || 'Authentication failed. Please try again.', 'error');
      } finally {
        setBusy(false);
      }
    });

    signoutButton.addEventListener('click', async () => {
      signoutButton.disabled = true;
      try {
        if (demoMode) {
          localStorage.removeItem('mgemz_demo_access');
          applySession(null);
          setMessage('Demo session closed.');
          return;
        }

        const { error } = await client.auth.signOut();
        if (error) throw error;
        applySession(null);
        setMessage('Signed out successfully.');
      } catch (error) {
        console.error('Supabase sign-out failed:', error);
        setMessage(error?.message || 'Could not sign out.', 'error');
      } finally {
        signoutButton.disabled = false;
      }
    });

    client.auth.onAuthStateChange((_event, session) => {
      if (demoMode && !session) return;
      if (session) localStorage.removeItem('mgemz_demo_access');
      applySession(session);
    });

    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        localStorage.removeItem('mgemz_demo_access');
        applySession(data.session);
      } else if (demoMode) {
        applySession(null, true);
      } else {
        applySession(null);
      }
    } catch (error) {
      console.error('Supabase session check failed:', error);
      if (demoMode) {
        applySession(null, true);
      } else {
        applySession(null);
        setMessage('Could not connect to Supabase. You can still use the free demo.', 'error');
      }
    }
  });
})();
