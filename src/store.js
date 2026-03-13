import { reactive } from 'vue';

const state = reactive({
  user: JSON.parse(localStorage.getItem('qs_user') || 'null'),
});

export function getUser()     { return state.user; }
export function setUser(user) {
  state.user = user;
  if (user) localStorage.setItem('qs_user', JSON.stringify(user));
  else      localStorage.removeItem('qs_user');
}
export function logout() { setUser(null); }
export { state };
