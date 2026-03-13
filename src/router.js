import { createRouter, createWebHashHistory } from 'vue-router';
import { getUser } from './store';

import LoginView  from './views/LoginView.vue';
import HomeView   from './views/HomeView.vue';
import TeamsView  from './views/admin/TeamsView.vue';
import UsersView  from './views/admin/UsersView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login',        component: LoginView,  meta: { public: true } },
    { path: '/',             component: HomeView },
    { path: '/admin/teams',  component: TeamsView,  meta: { admin: true } },
    { path: '/admin/users',  component: UsersView,  meta: { admin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to, from, next) => {
  const user = getUser();
  if (!to.meta.public && !user)               return next('/login');
  if (to.meta.admin && user?.role !== 'admin') return next('/');
  if (to.path === '/login' && user)            return next('/');
  next();
});

export default router;
