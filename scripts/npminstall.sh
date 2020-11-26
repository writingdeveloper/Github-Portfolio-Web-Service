cd /home/projects/build
echo "NPM 패키지를 설치합니다..."
npm install
echo "PM2 모듈을 실행합니다..."
pm2 start app.js --watch