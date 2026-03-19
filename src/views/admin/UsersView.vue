<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>员工管理</h2>
        <p>统一维护工号、姓名、角色、职级和群组式小组关系。每位员工可加入多个小组。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge hero-badge--light">
          <strong>{{ filteredUsers.length }}</strong>
          <span>当前员工数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增员工</el-button>
      </div>
    </section>

    <!-- 搜索过滤栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索员工姓名或工号..."
        clearable
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <el-empty v-else-if="filteredUsers.length === 0" :description="searchText ? '无匹配结果' : '暂无员工'" />
    <div v-else class="users-grid" @click="swipedId = null">
      <article
        v-for="u in filteredUsers"
        :key="u.id"
        class="user-card"
        :class="{ 'is-swiped': swipedId === u.id }"
        @touchstart.passive="e => onTouchStart(e)"
        @touchend.passive="e => onTouchEnd(e, u.id)"
      >
        <div class="user-card__main">
          <div class="user-avatar avatar--{{ u.role }}" :style="getAvatarStyle(u.name)">{{ u.name.charAt(0) }}</div>
          <div class="user-info">
            <strong class="user-name">{{ u.name }}</strong>
            <span class="user-title">{{ u.title_name || ROLE_LABELS[u.role] }}</span>
          </div>
        </div>
        <div class="card-acts">
          <button class="act-btn act-btn--edit" title="编辑" @click.stop="openEdit(u)">
            <el-icon><Edit /></el-icon>
          </button>
          <button class="act-btn act-btn--del" title="删除" @click.stop="handleDelete(u)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </article>
    </div>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑员工' : '新增员工'" class="admin-dialog">
      <el-form :model="form" label-width="80px">
        <el-form-item label="工号">
          <el-input v-model="form.employee_id" placeholder="工号（唯一）" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="职称" required>
          <el-select v-model="form.title_id" placeholder="选择职称（必选）" style="width:100%">
            <el-option v-for="jt in jobTitles" :key="jt.id" :label="jt.name" :value="jt.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option v-for="(label, val) in ROLE_LABELS"  :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="职能" required>
          <el-select v-model="form.department_id" placeholder="选择职能（必选，仅一个）" style="width:100%">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit, Delete } from '@element-plus/icons-vue';
import { api } from '../../api';

const ROLE_LABELS  = { admin: '管理员', leader: '组长', employee: '员工' };
const LEVEL_LABELS = { junior: '助理',  mid: '中级',   senior: '高级'   };

const route = useRoute(); // 在顶层调用

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

const users        = ref([]);
const teams        = ref([]);
const jobTitles    = ref([]);
const departments  = ref([]); // 新增：职能列表
const searchText   = ref('');
const loading      = ref(false);
const saving       = ref(false);
const dlgVisible   = ref(false);
const editingId    = ref(null);
const form         = reactive({ employee_id: '', name: '', role: 'employee', department_id: null, title_id: null });

let _tx0 = 0;
const swipedId = ref(null);

const filteredUsers = computed(() => {
  if (!searchText.value.trim()) return users.value;
  const keyword = searchText.value.toLowerCase();
  return users.value.filter(user => 
    user.name.toLowerCase().includes(keyword) ||
    user.employee_id.toLowerCase().includes(keyword)
  );
});
function onTouchStart(e) { _tx0 = e.touches[0].clientX; }
function onTouchEnd(e, id) {
  const dx = _tx0 - e.changedTouches[0].clientX;
  if (dx > 40) swipedId.value = id;
  else if (dx < -10) swipedId.value = null;
}

async function fetchAll() {
  loading.value = true;
  try {
    [users.value, teams.value, jobTitles.value, departments.value] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/teams'),
      api.get('/api/job-titles'),
      api.get('/api/departments'),
    ]);
  } catch { ElMessage.error('加载数据失败'); }
  finally { loading.value = false; }
}

function openAdd() {
  editingId.value  = null;
  Object.assign(form, { employee_id: '', name: '', role: 'employee', department_id: null, title_id: null });
  dlgVisible.value = true;
}

function openEdit(row) {
  editingId.value  = row.id;
  Object.assign(form, {
    employee_id: row.employee_id,
    name:        row.name,
    role:        row.role,
    department_id: row.department_id || null,
    title_id:    row.title_id || null,
  });
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.employee_id.trim()) { ElMessage.warning('工号不能为空'); return; }
  if (!form.name.trim())        { ElMessage.warning('姓名不能为空'); return; }
  
  // 验证职能（必选）
  if (!form.department_id) {
    ElMessage.warning('请选择职能（必选）');
    return;
  }
  
  // 验证职称（必选）
  if (!form.title_id) {
    ElMessage.warning('请选择职称（必选）');
    return;
  }
  
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/users/${editingId.value}`, form);
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/users', form);
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除员工「${row.name}（${row.employee_id}）」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/users/${row.id}`);
    ElMessage.success('删除成功');
    await fetchAll();
  } catch (e) {
    ElMessage.error(e?.error || '删除失败');
  }
}

onMounted(async () => {
  await fetchAll();
  
  // 检查 URL 参数，如果是从成员查看页面跳转过来的，自动打开编辑对话框
  const userId = route.query.id;
  const isEditMode = route.query.edit === 'true';
  
  if (userId && isEditMode) {
    const userToEdit = users.value.find(u => u.id === Number(userId));
    if (userToEdit) {
      openEdit(userToEdit);
      // 清除 URL 参数，避免刷新后重复打开
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
});
</script>

<style scoped>
.page { padding: 8px 0 0; }
  .admin-page { display: flex; flex-direction: column; gap: 18px; }
.admin-hero {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(226, 244, 255, .9));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
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
.admin-hero p { margin: 0; max-width: 680px; color: #60708a; line-height: 1.75; }
.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  min-width: 180px;
}
.hero-badge {
  padding: 18px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff;
  text-align: right;
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.25);
}
.hero-badge--light { background: linear-gradient(135deg, #fb923c, #facc15); }
.hero-badge strong { display: block; font-size: 28px; }
.hero-badge span { font-size: 13px; opacity: .86; }
.hero-button { min-width: 132px; border-radius: 10px; }
.loading-wrap { text-align: center; padding: 48px 0; color: #94a3b8; }
/* ── User card grid ── */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.user-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  transition: box-shadow .2s;
}
.user-card__main {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  transition: transform .22s ease;
}
.user-avatar {
  width: 46px; height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff; font-size: 20px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar--admin  { background: linear-gradient(135deg, #dc2626, #fb923c); }
.avatar--leader { background: linear-gradient(135deg, #7c3aed, #06b6d4); }
.user-name  { display: block; font-size: 15px; font-weight: 700; color: #1e293b; }
.user-title { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }
.card-acts {
  position: absolute;
  right: 8px;
  top: 8px;
  display: flex;
  flex-direction: row;
  gap: 6px;
}
.user-card:hover { box-shadow: 0 8px 24px rgba(29, 78, 216, 0.1); }
.act-btn {
  width: 30px; height: 30px; border: none; border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: background .12s;
}
.act-btn--edit { background: rgba(59,130,246,.12); color: #1d4ed8; }
.act-btn--edit:hover { background: rgba(59,130,246,.22); }
.act-btn--del  { background: rgba(239,68,68,.1); color: #dc2626; }
.act-btn--del:hover { background: rgba(239,68,68,.2); }
@media (max-width: 768px) {
  .admin-hero  { flex-direction: column; padding: 20px; }
  .hero-actions { width: 100%; align-items: stretch; }
  .users-grid  { grid-template-columns: 1fr; }
}
</style>
