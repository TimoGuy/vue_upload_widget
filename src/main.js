import './assets/main.css'

import { createApp } from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import App from './App.vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPaperclip, faCircleXmark, faXmark, faStop, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'


library.add(faPaperclip, faCircleXmark, faXmark, faStop, faCircleExclamation)

createApp(App)
    .component('font-awesome-icon', FontAwesomeIcon)
    .use(VueAxios, axios)
    .mount('#app')
