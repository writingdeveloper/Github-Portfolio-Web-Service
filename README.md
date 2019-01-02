# Github Portfolio Web Service
![](https://img.shields.io/badge/Code%20Statue-Open-brightgreen.svg) [![Build Status](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service.svg?branch=master)](https://travis-ci.org/sangumee/Github-Portfolio-Web-Service)

Developer Portfolio Site Using Github

## Introduction

I felt that the existing resume was not suitable for use with the developer's resume, and recently Github's profile was often submitted to check the developer's portfolio, but I also thought that Github's profile would not be able to properly identify the developer's capabilities.

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

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.