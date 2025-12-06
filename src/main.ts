import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/useAuthStore'
import { useCredentialStore } from './stores/useCredentialStore'
import { useWalletStore } from './stores/useWalletStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// 初始化所有 stores
const authStore = useAuthStore()
authStore.init()

const credentialStore = useCredentialStore()
credentialStore.init()

const walletStore = useWalletStore()
walletStore.init()
