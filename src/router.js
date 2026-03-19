import { createRouter, createWebHashHistory } from 'vue-router';
import { getUser } from './store';

import LoginView            from './views/LoginView.vue';
import HomeView             from './views/HomeView.vue';
import DepartmentsView      from './views/admin/DepartmentsView.vue'; // 职能管理
import DepartmentMembersView from './views/admin/DepartmentMembersView.vue'; // 职能成员查看
import TeamsView            from './views/admin/TeamsView.vue'; // 群组管理
import UsersView            from './views/admin/UsersView.vue'; // 员工管理
import TeamMembersView      from './views/admin/TeamMembersView.vue'; // 群组成员
import JobTitlesView        from './views/admin/JobTitlesView.vue'; // 职称管理
import JobLevelsView        from './views/admin/JobLevelsView.vue'; // 职级管理

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login',                     component: LoginView,         meta: { public: true } },
    { path: '/',                          component: HomeView },
    
    // 人员管理（一级菜单）
    { path: '/admin/users',               component: UsersView,         meta: { admin: true } }, // 员工管理
    { path: '/admin/departments',         component: DepartmentsView,   meta: { admin: true } }, // 职能管理
    { path: '/admin/departments/:id/members', component: DepartmentMembersView, meta: { admin: true } }, // 职能成员查看
    { path: '/admin/teams',               component: TeamsView,         meta: { admin: true } }, // 群组管理
    { path: '/admin/teams/:id/members',   component: TeamMembersView,   meta: { admin: true } }, // 群组成员
    { path: '/admin/job-titles',          component: JobTitlesView,     meta: { admin: true } }, // 职称管理
    { path: '/admin/job-levels',          component: JobLevelsView,     meta: { admin: true } }, // 职级管理
    
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
