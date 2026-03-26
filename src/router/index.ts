import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import PetPreview from '@/pages/PetPreview.vue'
import Ranking from '@/pages/Ranking.vue'
import Settings from '@/pages/Settings.vue'
import Records from '@/pages/Records.vue'
import Students from '@/pages/Students.vue'
import Admin from '@/pages/Admin.vue'
import PetProfileDemo from '@/pages/PetProfileDemo.vue'
import PetCardDemo from '@/pages/PetCardDemo.vue'
import ArenaZones from '@/pages/ArenaZones.vue'
import ArenaZone1 from '@/pages/ArenaZone1.vue'
import ArenaZone2 from '@/pages/ArenaZone2.vue'
import ArenaDemo from '@/pages/ArenaDemo.vue'
import ArenaJoinByCode from '@/pages/ArenaJoinByCode.vue'
import ShibaMotionDemo from '@/pages/ShibaMotionDemo.vue'
import PetInstances from '@/pages/PetInstances.vue'
import PetIdentity from '@/pages/PetIdentity.vue'
import PetCard from '@/pages/PetCard.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/preview', name: 'preview', component: PetPreview },
    { path: '/ranking', name: 'ranking', component: Ranking },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/records', name: 'records', component: Records },
    { path: '/students', name: 'students', component: Students },
    { path: '/admin', name: 'admin', component: Admin },
    { path: '/p/:code', name: 'pet-profile-demo', component: PetProfileDemo },
    { path: '/card/:code', name: 'pet-card-demo', component: PetCardDemo },
    { path: '/arena', name: 'arena-zones', component: ArenaZones },
    { path: '/arena/zone/1', name: 'arena-zone-1', component: ArenaZone1, meta: { requiresAuth: true } },
    { path: '/arena/zone/2', name: 'arena-zone-2', component: ArenaZone2, meta: { requiresAuth: true } },
    { path: '/arena/zone/:id', name: 'arena-zone', component: ArenaZones },
    { path: '/arena/pet/:code', name: 'arena-demo', component: ArenaDemo },
    { path: '/join/:code', name: 'arena-join', component: ArenaJoinByCode },
    { path: '/demo/shiba-motion', name: 'shiba-motion-demo', component: ShibaMotionDemo },
    { path: '/my-pets', name: 'pet-instances', component: PetInstances },
    { path: '/pet/:code', name: 'pet-identity', component: PetIdentity },
    { path: '/identity/:id', name: 'pet-identity-by-id', component: PetIdentity },
    { path: '/card/:code', name: 'pet-card', component: PetCard },
    { path: '/register', name: 'register', component: RegisterPage },
  ]
})

// 导航守卫：竞技场需要登录
router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const { isGuest } = useAuth()
    if (isGuest.value) {
      alert('竞技场需要登录后才能参加，请先登录或联系老师开通账号')
      return false
    }
  }
})

export default router
