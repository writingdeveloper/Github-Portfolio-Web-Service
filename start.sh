# /start.sh
# nvm에 대한 환경변수를 설정하는 것임.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

cd $PROJECT_ROOT

# 원래 node 프로세스 종료
sudo pkill -f node
nohup npm start >/home/project/logs 2>&1 </home/project/errors &

# `ps -ef | grep 'node ./bin/www' | awk '{print $2}'`