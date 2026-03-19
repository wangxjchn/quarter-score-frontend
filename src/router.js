import { createRouter, createWebHashHistory } from 'vue-router';
import { getUser } from './store';

import LoginView       from './views/LoginView.vue';
import HomeView        from './views/HomeView.vue';
import TeamsView       from './views/admin/TeamsView.vue';
import UsersView       from './views/admin/UsersView.vue';
import TeamMembersView from './views/admin/TeamMembersView.vue';
import JobTitlesView   from './views/admin/JobTitlesView.vue';
import JobLevelsView   from './views/admin/JobLevelsView.vue'; // 新增职级管理

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login',                   component: LoginView,       meta: { public: true } },
    { path: '/',                        component: HomeView },
    { path: '/admin/teams',             component: TeamsView,       meta: { admin: true } },
    { path: '/admin/teams/:id/members', component: TeamMembersView, meta: { admin: true } },
    { path: '/admin/users',             component: UsersView,       meta: { admin: true } },
    { path: '/admin/job-titles',        component: JobTitlesView,   meta: { admin: true } },
    { path: '/admin/job-levels',        component: JobLevelsView,   meta: { admin: true } }, // 新增职级管理路由
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
