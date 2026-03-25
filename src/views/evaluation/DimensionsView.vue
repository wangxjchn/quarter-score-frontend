<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">评分管理</p>
        <h2>评分维度管理</h2>
        <p>维护评分维度库，定义评分的标准和描述。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ dimensions.length }}</strong>
          <span>当前维度数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增维度</el-button>
      </div>
    </section>

    <!-- 维度列表 -->
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <div v-else class="dimensions-grid">
      <div v-for="dim in dimensions" :key="dim.id" class="dimension-card">
        <div class="dimension-card__header">
          <h3>{{ dim.name }}</h3>
          <div class="dimension-card__actions">
            <el-button size="small" @click="openEdit(dim)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(dim)">删除</el-button>
          </div>
        </div>
        <div class="dimension-card__content">
          <div class="dimension-card__row">
            <span class="label">分数范围：</span>
            <span>{{ dim.min_score }} - {{ dim.max_score }}</span>
          </div>
          <div class="dimension-card__desc">
            <span class="label">描述：</span>
            <p>{{ dim.description || '暂无描述' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingDimension ? '编辑维度' : '新增维度'"
      @close="resetForm"
      class="admin-dialog"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="维度名称" prop="name">
          <el-input v-model="form.name" placeholder="如：工作业绩" />
        </el-form-item>
        <el-form-item label="最低分" prop="min_score">
          <el-input-number v-model="form.min_score" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="最高分" prop="max_score">
          <el-input-number v-model="form.max_score" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="支持换行，如：0-59 分：表现差&#10;60-79 分：合格&#10;80-89 分：良好&#10;90-100 分：优秀"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { api } from '../../api';

const dimensions = ref([]);
const loading = ref(true);
const dialogVisible = ref(false);
const saving = ref(false);
const editingDimension = ref(null);
const formRef = ref(null);

const form = reactive({
  name: '',
  min_score: 0,
  max_score: 100,
  description: ''
});

const rules = {
  name: [{ required: true, message: '请输入维度名称', trigger: 'blur' }],
  min_score: [{ required: true, message: '请输入最低分', trigger: 'blur' }],
  max_score: [{ required: true, message: '请输入最高分', trigger: 'blur' }]
};

async function fetchDimensions() {
  try {
    loading.value = true;
    const data = await api.get('/api/evaluations/dimensions');
    dimensions.value = data;
  } catch (error) {
    console.error('获取维度失败:', error);
    ElMessage.error('加载维度失败');
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingDimension.value = null;
  dialogVisible.value = true;
}

function openEdit(dim) {
  editingDimension.value = dim;
  Object.assign(form, {
    name: dim.name,
    min_score: dim.min_score,
    max_score: dim.max_score,
    description: dim.description
  });
  dialogVisible.value = true;
}

function resetForm() {
  editingDimension.value = null;
  form.name = '';
  form.min_score = 0;
  form.max_score = 100;
  form.description = '';
  formRef.value?.clearValidate();
}

async function handleSubmit() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    try {
      saving.value = true;
      
      if (editingDimension.value) {
        await api.put(`/api/evaluations/dimensions/${editingDimension.value.id}`, form);
        ElMessage.success('更新成功');
      } else {
        await api.post('/api/evaluations/dimensions', form);
        ElMessage.success('创建成功');
      }
      
      dialogVisible.value = false;
      fetchDimensions();
    } catch (error) {
      console.error('操作失败:', error);
      ElMessage.error(error.response?.data?.error || '操作失败');
    } finally {
      saving.value = false;
    }
  });
}

async function handleDelete(dim) {
  try {
    await ElMessageBox.confirm(`确定要删除维度"${dim.name}"吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await api.delete(`/api/evaluations/dimensions/${dim.id}`);
    ElMessage.success('删除成功');
    fetchDimensions();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
}

onMounted(fetchDimensions);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.admin-hero {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .88));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  justify-content: space-between;
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
.hero-badge strong { display: block; font-size: 28px; }
.hero-badge span { font-size: 13px; opacity: .86; }
.hero-button { min-width: 132px; border-radius: 10px; }
.loading-wrap { text-align: center; padding: 48px 0; color: #94a3b8; }

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.dimension-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: box-shadow .2s;
}

.dimension-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

.dimension-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.05), rgba(6, 182, 212, 0.05));
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.dimension-card__header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.dimension-card__actions {
  display: flex;
  gap: 8px;
}

.dimension-card__content {
  padding: 16px;
}

.dimension-card__row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.dimension-card__row .label {
  color: #64748b;
  font-weight: 600;
  min-width: 70px;
}

.dimension-card__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.dimension-card__desc .label {
  color: #64748b;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.dimension-card__desc p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .admin-hero { flex-direction: column; padding: 20px; }
  .hero-actions { width: 100%; align-items: stretch; }
  .dimensions-grid { grid-template-columns: 1fr; }
}
</style>
