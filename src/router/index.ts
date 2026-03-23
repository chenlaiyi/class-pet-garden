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
import ArenaDemo from '@/pages/ArenaDemo.vue'
import ShibaMotionDemo from '@/pages/ShibaMotionDemo.vue'

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
    { path: '/arena', name: 'arena-demo', component: ArenaDemo },
    { path: '/demo/shiba-motion', name: 'shiba-motion-demo', component: ShibaMotionDemo }
  ]
})

export default router
