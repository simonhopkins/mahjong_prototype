import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
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

const copyPublicPlugin = () => {
    return {
        name: 'copy-public',
        closeBundle() {
            const publicDir = 'public';
            const outDir = 'dist/public';
            
            if (existsSync(publicDir)) {
                if (!existsSync(outDir)) {
                    mkdirSync(outDir, { recursive: true });
                }
                
                const copyRecursive = (src, dest) => {
                    const entries = readdirSync(src);
                    
                    for (const entry of entries) {
                        const srcPath = join(src, entry);
                        const destPath = join(dest, entry);
                        
                        if (statSync(srcPath).isDirectory()) {
                            if (!existsSync(destPath)) {
                                mkdirSync(destPath, { recursive: true });
                            }
                            copyRecursive(srcPath, destPath);
                        } else {
                            copyFileSync(srcPath, destPath);
                        }
                    }
                };
                
                copyRecursive(publicDir, outDir);
                process.stdout.write(`📁 Copied public folder to dist/public\n`);
            }
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [
        react(),
        phasermsg(),
        copyPublicPlugin()
    ],
    logLevel: 'warning',
    publicDir: false, // Disable default public dir handling
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                },
                assetFileNames: (assetInfo) => {
                    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];
                    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
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
                    
                    return 'assets/[name]-[hash][extname]';
                },
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
            }
        },
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