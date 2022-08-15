import {defineConfig} from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
    base: '/hoops-vr/',
    server: {https: true, host: true, port: 8000},
    plugins: [mkcert()],
})