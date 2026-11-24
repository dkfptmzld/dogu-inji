cd "$(dirname "$0")" && cat src/base.js src/w810_body.js src/w810_scenes.js > src/w810.js && npx esbuild src/w810.js --bundle --outfile=w810.bundle.js --log-level=warning
