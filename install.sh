cd /home/project/build
pm2 delete app
chmod 777 -R /home/project/build/Github-Portfolio-Web-Service
rm -r /home/project/build/Github-Portfolio-Web-Service
git clone https://github.com/writingdeveloper/Github-Portfolio-Web-Service
cp .env Github-Portfolio-Web-Service/
cd Github-Portfolio-Web-Service
npm install
chmod 777 -R /home/project/build/Github-Portfolio-Web-Service
pm2 start app.js --watch