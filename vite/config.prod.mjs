import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);
            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [
        react(),
        phasermsg()
    ],
    logLevel: 'warning',
    publicDir: 'public', // This ensures assets from public folder are copied
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                },
                // Organize output files into folders
                assetFileNames: (assetInfo) => {
                    // Put images in assets/images
                    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];
                    // Put audio in assets/audio
                    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
                    // Put fonts in assets/fonts
                    const fontExtensions = ['woff', 'woff2', 'eot', 'ttf', 'otf'];
                    
                    const ext = assetInfo.name.split('.').pop();
                    
                    if (imageExtensions.includes(ext)) {
                        return 'assets/images/[name]-[hash][extname]';
                    }
                    if (audioExtensions.includes(ext)) {
                        return 'assets/audio/[name]-[hash][extname]';
                    }
                    if (fontExtensions.includes(ext)) {
                        return 'assets/fonts/[name]-[hash][extname]';
                    }
                    
                    // Everything else goes to assets folder
                    return 'assets/[name]-[hash][extname]';
                },
                // Put JS chunks in js folder
                chunkFileNames: 'js/[name]-[hash].js',
                // Put entry files in js folder
                entryFileNames: 'js/[name]-[hash].js',
            }
        },
        // Copy public folder contents to dist/public
        assetsDir: 'assets',
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});