<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">评分管理</p>
        <h2>评分活动管理</h2>
        <p>创建和管理评分活动，每个评分活动包含季度信息和基础配置。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ ratings.length }}</strong>
          <span>当前评分数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="() => $router.push('/evaluation/ratings/new')">新增评分</el-button>
      </div>
    </section>

    <!-- 评分列表 -->
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>
    <div v-else class="ratings-grid">
      <div v-for="rating in ratings" :key="rating.id" class="rating-card">
        <div class="rating-card__header">
          <h3>{{ rating.name }}</h3>
          <div class="rating-card__actions">
            <el-tooltip content="编辑" placement="top">
              <el-button :icon="Edit" size="small" circle @click="() => $router.push(`/evaluation/ratings/${rating.id}/edit`)" />
            </el-tooltip>
            <el-tooltip content="复制" placement="top">
              <el-button :icon="DocumentCopy" size="small" circle @click="handleDuplicate(rating)" />
            </el-tooltip>
            <el-tooltip :content="rating.status === 'pending' ? '发起' : (rating.status === 'active' ? '结束' : '已归档')" placement="top">
              <el-button 
                :icon="rating.status === 'pending' ? VideoPlay : (rating.status === 'active' ? VideoPause : Lock)" 
                size="small" 
                circle 
                :type="rating.status === 'pending' ? 'primary' : (rating.status === 'active' ? 'warning' : 'info')"
                :disabled="rating.status === 'closed'"
                @click="handleToggleStatus(rating)" 
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button :icon="Delete" size="small" circle type="danger" :disabled="!['pending','closed'].includes(rating.status)" @click="handleDelete(rating)" />
            </el-tooltip>
            <el-tooltip content="详细信息" placement="top">
              <el-button :icon="InfoFilled" size="small" circle @click="() => $router.push(`/evaluation/ratings/${rating.id}/progress`)" />
            </el-tooltip>
          </div>
        </div>
        <div class="rating-card__content">
          <div class="rating-card__row">
            <span class="label">季度：</span>
            <el-tag size="small">{{ rating.quarter }}</el-tag>
            <span class="label" style="margin-left: 12px;">状态：</span>
            <el-tag size="small" :type="rating.status === 'active' ? 'success' : (rating.status === 'closed' ? 'info' : 'warning')">{{ rating.status }}</el-tag>
          </div>
          <div class="rating-card__desc">
            <span class="label">描述：</span>
            <p>{{ rating.description || '暂无描述' }}</p>
          </div>
          <div class="rating-card__footer">
            <span class="label">创建时间：</span>
            <span>{{ formatDate(rating.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Loading, Edit, DocumentCopy, VideoPlay, VideoPause, Lock, Delete, InfoFilled } from '@element-plus/icons-vue';
import { api } from '../../api';

const ratings = ref([]);
const loading = ref(true);

async function fetchRatings() {
  try {
    loading.value = true;
    const data = await api.get('/api/evaluations/ratings');
    ratings.value = data;
  } catch (error) {
    console.error('获取评分失败:', error);
    ElMessage.error('加载评分失败');
  } finally {
    loading.value = false;
  }
}

async function handleDelete(rating) {
  try {
    if (!['pending', 'closed'].includes(rating.status)) {
      ElMessage.warning('仅挂起或关闭状态可删除');
      return;
    }
    await ElMessageBox.confirm(`确定要删除评分"${rating.name}"吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await api.delete(`/api/evaluations/ratings/${rating.id}`);
    ElMessage.success('删除成功');
    fetchRatings();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
}

async function handleDuplicate(rating) {
  try {
    // 获取原评分活动的详细信息
    const detail = await api.get(`/api/evaluations/ratings/${rating.id}`);
    
    // 创建新的评分活动，复制所有信息
    const newRating = {
      name: `${detail.name} - 副本`,
      quarter: detail.quarter,
      description: detail.description,
      status: 'pending',
      config: detail.config || {}
    };
    
    const result = await api.post('/api/evaluations/ratings', newRating);
    
    ElMessage.success('复制成功');
    fetchRatings();
  } catch (error) {
    console.error('复制失败:', error);
    ElMessage.error(error.response?.data?.error || '复制失败');
  }
}

async function handleToggleStatus(rating) {
  try {
    let newStatus;
    if (rating.status === 'pending') {
      newStatus = 'active';
    } else if (rating.status === 'active') {
      newStatus = 'closed';
    } else {
      return;
    }
    
    await api.put(`/api/evaluations/ratings/${rating.id}`, {
      ...rating,
      status: newStatus
    });
    
    ElMessage.success(`已${newStatus === 'active' ? '发起' : '结束'}评分活动`);
    fetchRatings();
  } catch (error) {
    console.error('操作失败:', error);
    ElMessage.error(error.response?.data?.error || '操作失败');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

onMounted(fetchRatings);
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

.ratings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.rating-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  transition: box-shadow .2s;
}

.rating-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

.rating-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.05), rgba(6, 182, 212, 0.05));
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.rating-card__actions {
  display: flex;
  gap: 8px;
}

.rating-card__header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.rating-card__actions {
  display: flex;
  gap: 8px;
}

.rating-card__content {
  padding: 16px;
}

.rating-card__row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  align-items: center;
}

.rating-card__row .label {
  color: #64748b;
  font-weight: 600;
  min-width: 70px;
}

.rating-card__desc {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.rating-card__desc .label {
  color: #64748b;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.rating-card__desc p {
  margin: 0;
  color: #475569;
  line-height: 1.8;
  white-space: pre-line;
}

.rating-card__footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .admin-hero { flex-direction: column; padding: 20px; }
  .hero-actions { width: 100%; align-items: stretch; }
  .ratings-grid { grid-template-columns: 1fr; }
}
</style>
