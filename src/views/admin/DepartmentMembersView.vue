<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>{{ department?.name || '职能成员' }}</h2>
        <p v-if="department" class="hero-desc">共 {{ members.length }} 名员工</p>
      </div>
      <el-button class="hero-button" @click="goBack">返回</el-button>
    </section>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="(!department || members.length === 0) && !loading" description="该职能下暂无员工" />
    <div v-else class="members-grid">
      <article
        v-for="m in members"
        :key="m.id"
        class="member-card"
      >
        <div class="member-card__main">
          <div class="member-card__avatar" :style="getAvatarStyle(m.name)">{{ m.name.charAt(0) }}</div>
          <div class="member-card__info">
            <strong class="member-card__name">{{ m.name }}</strong>
            <span class="member-card__title">{{ m.title_name || ROLE_LABELS[m.role] }}</span>
          </div>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--edit" title="编辑" @click.stop="openEditMember(m)">
            <el-icon><Edit /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="editDlgVisible" :title="'编辑员工信息'" class="admin-dialog">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="工号">
          <el-input v-model="editForm.employee_id" placeholder="工号（唯一）" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="职称" required>
          <el-select v-model="editForm.title_id" placeholder="选择职称（必选）" style="width:100%">
            <el-option v-for="jt in jobTitles" :key="jt.id" :label="jt.name" :value="jt.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width:100%">
            <el-option v-for="(label, val) in ROLE_LABELS" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="职能" required>
          <el-select v-model="editForm.department_id" placeholder="选择职能（必选，仅一个）" style="width:100%">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDlgVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit } from '@element-plus/icons-vue';
import { api } from '../../api';

const route = useRoute();
const router = useRouter();
const department = ref(null);
const members = ref([]);
const jobTitles = ref([]);
const departments = ref([]); // 职能部门列表
const loading = ref(true); // 初始为 true，等待数据加载
const editDlgVisible = ref(false);
const editSaving = ref(false);
const editingMember = ref(null);
const editForm = reactive({ employee_id: '', name: '', role: 'employee', department_id: null, title_id: null });

const ROLE_LABELS = { admin: '管理员', leader: '组长', employee: '员工' };
const LEVEL_LABELS = { junior: '助理', mid: '中级', senior: '高级' };

async function fetchMembers() {
  loading.value = true;
  try {
    const [deptData, jobTitlesData, departmentsData] = await Promise.all([
      api.get(`/api/departments/${route.params.id}`),
      api.get('/api/job-titles'),
      api.get('/api/departments'), // 加载所有职能部门列表
    ]);
    department.value = deptData;
    members.value = deptData.members || [];
    jobTitles.value = jobTitlesData;
    departments.value = departmentsData;
  } catch (e) {
    console.error('加载成员失败:', e);
    ElMessage.error('加载数据失败，请刷新页面重试');
  } finally {
    loading.value = false;
  }
}

function openEditMember(member) {
  // 打开编辑对话框
  editingMember.value = member;
  Object.assign(editForm, {
    employee_id: member.employee_id,
    name: member.name,
    role: member.role,
    department_id: member.department_id || null,
    title_id: member.title_id || null,
  });
  editDlgVisible.value = true;
}

async function handleEditSave() {
  if (!editForm.employee_id.trim()) { ElMessage.warning('工号不能为空'); return; }
  if (!editForm.name.trim()) { ElMessage.warning('姓名不能为空'); return; }
  
  // 验证职能（必选）
  if (!editForm.department_id) {
    ElMessage.warning('请选择职能（必选）');
    return;
  }
  
  // 验证职称（必选）
  if (!editForm.title_id) {
    ElMessage.warning('请选择职称（必选）');
    return;
  }
  
  editSaving.value = true;
  try {
    await api.put(`/api/users/${editingMember.value.id}`, editForm);
    ElMessage.success('更新成功');
    editDlgVisible.value = false;
    // 仅更新当前成员信息，不改变列表顺序
    const idx = members.value.findIndex(m => m.id === editingMember.value.id);
    if (idx !== -1) {
      members.value[idx] = { ...members.value[idx], ...editForm };
    }
    // 如果修改了职能，需要重新加载整个列表
    if (editForm.department_id !== editingMember.value.department_id) {
      await fetchMembers();
    }
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    editSaving.value = false;
  }
}

function getAvatarStyle(name) {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return { background: colors[index] };
}

function goBack() {
  router.push('/admin/departments');
}

onMounted(fetchMembers);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.admin-page { display: flex; flex-direction: column; gap: 18px; }
.admin-hero {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .88));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 24px;
}
.section-chip {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 700;
}
.admin-hero h2 { margin: 0 0 8px; font-size: 32px; }
.hero-desc { margin: 0; max-width: 680px; color: #60708a; line-height: 1.75; }
.hero-button { min-width: 132px; border-radius: 10px; }
.loading-wrap { text-align: center; padding: 48px 0; color: #94a3b8; }

/* ── Card grid ── */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.member-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition: box-shadow .2s;
}
.member-card__main {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  transition: transform .22s ease;
}
.member-card__avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}
.member-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.member-card__name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.member-card__title {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.card-acts {
  position: absolute;
  right: 8px;
  top: 8px;
  display: flex;
  flex-direction: row;
  gap: 6px;
}
.member-card:hover { box-shadow: 0 8px 24px rgba(29, 78, 216, 0.1); }
.act-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background .12s;
}
.act-btn--edit { background: rgba(59,130,246,.12); color: #1d4ed8; }
.act-btn--edit:hover { background: rgba(59,130,246,.22); }
@media (max-width: 768px) {
  .admin-hero { flex-direction: column; padding: 20px; }
  .hero-actions { width: 100%; align-items: stretch; }
  .members-grid { grid-template-columns: 1fr; }
}
</style>
