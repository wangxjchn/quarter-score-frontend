import { getUser } from './store';

const BASE = import.meta.env.VITE_API_BASE;

async function request(method, path, body) {
  const user = getUser();
  const headers = { 'Content-Type': 'application/json' };
  if (user) headers['X-Employee-ID'] = user.employee_id;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res  = await fetch(`${BASE}${path}`, opts);
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw data;
  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};
