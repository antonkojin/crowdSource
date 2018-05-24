window.onload = () => {
  const form = document.forms['login-form'];
  
  document.querySelectorAll('input[type="radio"]').forEach(r => r.onclick = () => {
    const action = ['/', form.user.value, '/login'].join('');
    form.action = action;
  });
};