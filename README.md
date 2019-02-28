# Github Portfolio Web Service
![](https://img.shields.io/badge/Code%20Statue-Open-brightgreen.svg) [![Build Status](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service.svg?branch=master)](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service)

Developer Portfolio Site Using Github

## DEMO

This project is currently hosted in Heroku and MariaDB is available from my raspberry pi server.  
You can access it from the link below and there may be a delay of up to 5 seconds during the initial connection.

[Link](https://expressme.herokuapp.com/)


## Introduction

I felt that the existing resume was not suitable for use with the developer's resume, and recently Github's profile was often submitted to check the developer's portfolio, but I also thought that Github's profile would not be able to properly identify the developer's capabilities.

## TODO
This Web Application contains the following features:

👨‍💻FINISHED👨‍💻

1. Login function using Github API (Passport.js) ✔️
2. Use Github API to generate personal portfolio page by using information from individual repository after login ✔️
3. Ability to parse the README.md file for that Github in the details page and display the details. ✔️
4. If you are the owner of the portfolio, you will be able to add, delete and modify projects (personal identification using Session) ✔️
5. Use Amazon S3 storage to use External Storage (Fix existing code Create & Update & Delete Process) ✔️
6. Development of member personal information management page ✔️
7. Developing an admin member management page ✔️
8. Developing chat pages for contact items ✔️
9. Development of the method for naming image files when uploading images and the function to delete images when deleting portfolios ✔️
10. Image files should save in External Storage, not in heroku or Github Server ✔️

🧶NOT YET FINISHED🧶
1. If the member sign - up method was used instead of logging in through Github, a discussion on how to manage member information
2. In Mypage check the owner in Server-Side
3. Layout Problems in Mypage
4. Responsive Design in Chat pages
5. Chat simliar part should be fixed
6. Register with Google Method Add

### Prerequisites

This program requires pre-installation of the program below.  
The tested version is shown below and is developed based on the LTS version of Node.js.

```
1. Node.js 10.15.0 LTS
2. MariaDB 10.1.23 or MySQL DB
```

### Installing


The program will also be uploaded to the NPM in the future, and currently it will only write the installation method through the ZIP file.

1. Download ZIP file with this [Link](https://github.com/sangumee/Github-Portfolio-Web-Service/archive/master.zip).
2. Unzip the downloaded file.
3. From the command line, navigate to the directory and run it using the following command. It supports two methods.

```
1. node ./bin/www (Default)
2. supervisor ./bin/www
```

From the web browser, you can access the following address:

```
127.0.0.1:3000 (Default Port : 3000)
```

## Built With

* [Express](https://expressjs.com) - Web Framework
* [Pug](https://pugjs.org/api/getting-started.html) - HTML Template Engine
* [Bootstrap](https://getbootstrap.com/) - UI Framework

## Issues

Use the Issue tab if you have any problems and questions with this program. Please give some ideas or ask for cooperation! [Issue](https://github.com/sangumee/Github-Portfolio-Web-Service/issues)

Also, since the member personal page has not been developed, there is no membership withdrawal function after signing up. And now Github's personal information is stored on the server. If you request me to delete this, send your Github nickname to super2451894@gmail.com and I will notify you after deleting your personal information.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.