# Github Portfolio Web Service
![](https://img.shields.io/badge/Code%20Statue-Open-brightgreen.svg) [![Build Status](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service.svg?branch=master)](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service)

Developer Portfolio Site Using Github

## DEMO

This project is currently hosted in Heroku and MariaDB is available from my raspberry pi server.  
You can access it from the link below and there may be a delay of up to 5 seconds during the initial connection.

[Direct Link](https://expressme.herokuapp.com/)

## Project Map
<img src="public/images/app/main/Project Map.png">


## Introduction

I felt that the existing resume was not suitable for use with the developer's resume, and recently Github's profile was often submitted to check the developer's portfolio, but I also thought that Github's profile would not be able to properly identify the developer's capabilities.

## TODO
This Web Application contains the following features:

👨‍💻FINISHED👨‍💻

✅ Login with Github Function (Passport.js)  
✅ Login with Google Function (Passport.js)  
✅ After login, parse Github Repository to use individual portfolio page (Github API)   
✅ Each portfolio page can parse README.md file from Github (Request, CheerIO Package)  
✅ Owner Check to show different UI (Passport.js with Session and Cookies)  
✅ Use Amazon S3 storage to use External Image Storage (AWS)  
✅ Developing 'Mypage' to manage portfolio data (MySQL)  
✅ Developing 'Chat' Page in Admin panel to contact each other (SocketIO)  
✅ Developing 'Error' Page to handle Error and report to Administrator & Log (MySQL, Express)  
✅ Fix number of bugs that users might encounter in their use

Please check the detailed function list below.

👨‍💻NOT YET FINISHED👨‍💻
1. When if register with 'Google' users cannot use their portfolio's README.md file
2. In Mypage check the owner in Server-Side (Pending due to test)
3. Responsive Design in Chat pages
4. Developing Personal Introduction Page

## Detailed Function

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

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.