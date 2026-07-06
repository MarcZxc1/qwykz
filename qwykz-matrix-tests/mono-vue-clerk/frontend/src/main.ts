import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupClerk } from './lib/clerk'

const app = createApp(App)
setupClerk(app)
app.mount('#app')